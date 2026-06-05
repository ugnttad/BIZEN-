import { Router } from "express";
import { env } from "../../config/env.js";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getBusinessDate } from "../../shared/businessDate.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { ensurePayrollAdjustmentSchema } from "../payroll/payroll.service.js";
import {
  createTextResponse as createGeminiTextResponse,
  createTextStream as createGeminiTextStream,
  describeGeminiIssue,
  isGeminiReady
} from "./gemini.service.js";
import {
  createTextResponse as createGroqTextResponse,
  createTextStream as createGroqTextStream,
  describeGroqIssue,
  isGroqReady
} from "./groq.service.js";

export const aiRouter = Router();

const MAX_CHAT_AI_OUTPUT_TOKENS = 360;

const AI_ASSISTANT_INSTRUCTIONS =
  "Bạn là BIZEN AI, trợ lý vận hành nhân sự/payroll trong hệ thống SaaS BIZEN. Trả lời bằng tiếng Việt, ngắn gọn, thực dụng. Chỉ dùng dữ liệu hệ thống được cung cấp; nếu thiếu dữ liệu, nói rõ là chưa đủ dữ liệu. Ưu tiên hành động cụ thể cho chủ sở hữu SME/hospitality tại Đà Nẵng.";

function currentPayrollMonth(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

async function buildAiContext(companyId) {
  await ensurePayrollAdjustmentSchema();
  const today = getBusinessDate();
  const payrollMonth = currentPayrollMonth();
  const [summary, departments, lateEmployees, payrollDeductions, payrollAdjustments, leaves, alerts] = await Promise.all([
    query(
      `SELECT
        (SELECT COUNT(*)::int FROM employees WHERE company_id = $1) AS employees,
        COUNT(*) FILTER (WHERE check_in IS NOT NULL)::int AS "checkedIn",
        COUNT(*) FILTER (WHERE status = 'Late')::int AS late,
        COUNT(*) FILTER (WHERE status = 'Leave')::int AS leave,
        COUNT(*) FILTER (WHERE status = 'Absent')::int AS absent,
        COUNT(*) FILTER (WHERE status = 'Overtime')::int AS overtime
       FROM attendance_records
       WHERE company_id = $1 AND work_date = $2`,
      [companyId, today]
    ),
    query(
      `SELECT
        d.name,
        d.target_headcount AS "targetHeadcount",
        COUNT(e.id)::int AS employees,
        COUNT(e.id) FILTER (WHERE e.status = 'On leave')::int AS "onLeave"
       FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id AND e.company_id = d.company_id
       WHERE d.company_id = $1
       GROUP BY d.id
       ORDER BY d.name`,
      [companyId]
    ),
    query(
      `SELECT e.name, d.name AS department, COUNT(a.id)::int AS late
       FROM attendance_records a
       JOIN employees e ON e.id = a.employee_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE a.company_id = $1 AND a.status = 'Late'
       GROUP BY e.id, d.name
       ORDER BY late DESC, e.name
       LIMIT 5`,
      [companyId]
    ),
    query(
      `SELECT
        e.name,
        d.name AS department,
        COALESCE(pi.pay_type, 'Monthly') AS "payType",
        pi.base_salary::int AS "baseSalary",
        COALESCE(pi.hourly_rate, 0)::int AS "hourlyRate",
        COALESCE(pi.total_hours, 0)::float AS "totalHours",
        pi.deduction::int AS deduction,
        pi.final_salary::int AS "finalSalary",
        pi.status
       FROM payroll_items pi
       JOIN payroll_runs pr ON pr.id = pi.payroll_run_id
       JOIN employees e ON e.id = pi.employee_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE pr.company_id = $1 AND pr.month = $2
       ORDER BY pi.deduction DESC
       LIMIT 4`,
      [companyId, payrollMonth]
    ),
    query(
      `SELECT
        e.name,
        d.name AS department,
        pa.kind,
        pa.category,
        pa.amount::int AS amount,
        pa.note
       FROM payroll_adjustments pa
       JOIN employees e ON e.id = pa.employee_id AND e.company_id = pa.company_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE pa.company_id = $1 AND pa.month = $2
       ORDER BY pa.amount DESC, pa.created_at DESC
       LIMIT 5`,
      [companyId, payrollMonth]
    ),
    query(
      `SELECT lr.id, e.name AS employee, d.name AS department, lr.status, lr.days::float AS days, lr.reason
       FROM leave_requests lr
       JOIN employees e ON e.id = lr.employee_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE lr.company_id = $1
       ORDER BY lr.status DESC, lr.id DESC
       LIMIT 5`,
      [companyId]
    ),
    query("SELECT alert_type AS type, title, detail FROM ai_alerts WHERE company_id = $1 ORDER BY id", [companyId])
  ]);

  return {
    date: today,
    payrollMonth,
    company: "Current company",
    summary: summary.rows[0],
    departments: departments.rows,
    lateEmployees: lateEmployees.rows,
    payrollDeductions: payrollDeductions.rows,
    payrollAdjustments: payrollAdjustments.rows,
    leaveRequests: leaves.rows,
    alerts: alerts.rows
  };
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function fallbackReply(text, context) {
  const lower = normalizeText(text);
  const topLate = context.lateEmployees?.map((item) => `${item.name} (${item.late} lần)`).join(", ");
  const shortage = context.departments?.find((item) => item.employees < item.targetHeadcount);
  const shortageAlert = context.alerts?.find((item) => normalizeText(`${item.title} ${item.detail}`).includes("thieu"));
  const highestDeduction = context.payrollDeductions?.[0];
  const biggestAdjustment = context.payrollAdjustments?.[0];

  if (lower.includes("lich") || lower.includes("xep")) {
    return "Dựa trên Neon, nên tránh xếp nhân viên đang có đơn nghỉ đã duyệt và ưu tiên bù cho ca thiếu người. Hiện cảnh báo lớn nhất là Warehouse thiếu nhân sự so với target.";
  }
  if (lower.includes("tre")) {
    return topLate ? `Nhóm đi trễ nhiều nhất hiện là: ${topLate}. Chủ sở hữu nên nhắc riêng và kiểm tra lại ca/địa điểm check-in.` : "Hiện chưa có dữ liệu đi trễ trong Neon.";
  }
  if (lower.includes("chi phi") || lower.includes("phu cap") || lower.includes("tam ung") || lower.includes("thuong") || lower.includes("phat")) {
    return biggestAdjustment
      ? `Khoản nhập tay lớn nhất tháng ${context.payrollMonth}: ${biggestAdjustment.name} - ${biggestAdjustment.category} ${biggestAdjustment.kind === "Addition" ? "cộng" : "trừ"} ${biggestAdjustment.amount.toLocaleString("vi-VN")} VND. AI sẽ dùng khoản này khi phân tích payroll.`
      : `Tháng ${context.payrollMonth} chưa có khoản chi phí/điều chỉnh lương nhập tay.`;
  }
  if (lower.includes("luong")) {
    return highestDeduction
      ? `Khoản lương giảm nổi bật thuộc về ${highestDeduction.name}: khấu trừ ${highestDeduction.deduction.toLocaleString("vi-VN")} VND, lương cuối ${highestDeduction.finalSalary.toLocaleString("vi-VN")} VND.`
      : "Hiện chưa có dữ liệu khấu trừ payroll trong Neon.";
  }
  if (lower.includes("thieu")) {
    return shortage
      ? `${shortage.name} đang có ${shortage.employees}/${shortage.targetHeadcount} nhân sự so với target. Nên kiểm tra lịch nghỉ và điều phối người thay ca.`
      : shortageAlert
        ? `${shortageAlert.title}: ${shortageAlert.detail}`
        : "Chưa thấy bộ phận nào thiếu headcount hoặc có cảnh báo thiếu người trong Neon.";
  }
  return `Tôi đã đọc dữ liệu Neon ngày ${context.date}: ${context.summary?.employees || 0} nhân viên, ${context.summary?.checkedIn || 0} đã chấm công, ${context.summary?.late || 0} đi trễ, ${context.alerts?.length || 0} cảnh báo AI.`;
}

function buildChatInput(message, context) {
  return `Câu hỏi của người dùng: ${message}\n\nDữ liệu Neon hiện có:\n${JSON.stringify(context, null, 2)}`;
}

function buildCompactChatInput(message, context) {
  return JSON.stringify({ question: message, neon: context });
}

function writeSse(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function streamFallbackReply(res, reply, mode, issue = null) {
  writeSse(res, "meta", { mode, issue });

  const chunks = reply.match(/.{1,28}(\s|$)/g) || [reply];
  for (const chunk of chunks) {
    if (res.writableEnded) return;
    writeSse(res, "delta", { delta: chunk });
    await new Promise((resolve) => setTimeout(resolve, 16));
  }

  writeSse(res, "done", { mode, issue });
}

aiRouter.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `SELECT id, alert_type AS type, title, detail FROM ai_alerts WHERE company_id = $1 ORDER BY id`,
      [companyId]
    );
    res.json(result.rows);
  })
);

aiRouter.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const message = String(req.body.message || "").trim();
    const companyId = await getCompanyIdForUser(req.user);
    const context = await buildAiContext(companyId);

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: "Câu hỏi tối đa 500 ký tự" });
    }

    if (!isGroqReady() && !isGeminiReady()) {
      return res.json({ reply: fallbackReply(message, context), mode: "neon-fallback" });
    }

    if (isGroqReady()) {
      try {
        const response = await createGroqTextResponse({
          instructions: AI_ASSISTANT_INSTRUCTIONS,
          input: buildCompactChatInput(message, context),
          maxOutputTokens: MAX_CHAT_AI_OUTPUT_TOKENS
        });

        if (response?.output_text) {
          return res.json({ reply: response.output_text, mode: "groq", model: env.groqModel });
        }
      } catch (error) {
        if (!isGeminiReady()) {
          return res.json({ reply: fallbackReply(message, context), mode: "groq-fallback", issue: describeGroqIssue(error) });
        }
      }
    }

    try {
      const response = await createGeminiTextResponse({
        instructions: AI_ASSISTANT_INSTRUCTIONS,
        input: buildCompactChatInput(message, context),
        maxOutputTokens: MAX_CHAT_AI_OUTPUT_TOKENS
      });

      res.json({ reply: response.output_text || fallbackReply(message, context), mode: isGroqReady() ? "gemini-after-groq" : "gemini", model: env.geminiModel });
    } catch (error) {
      res.json({ reply: fallbackReply(message, context), mode: "gemini-fallback", issue: describeGeminiIssue(error) });
    }
  })
);

aiRouter.post(
  "/chat/stream",
  asyncHandler(async (req, res) => {
    const message = String(req.body.message || "").trim();
    const companyId = await getCompanyIdForUser(req.user);
    const context = await buildAiContext(companyId);

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: "Câu hỏi tối đa 500 ký tự" });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    let closed = false;
    let streamedText = "";
    req.on("close", () => {
      closed = true;
    });

    if (!isGroqReady() && !isGeminiReady()) {
      await streamFallbackReply(res, fallbackReply(message, context), "neon-fallback");
      if (!res.writableEnded) res.end();
      return;
    }

    async function streamProvider({ mode, model, createStream }) {
      writeSse(res, "meta", { mode, model });
      const stream = await createStream({
        instructions: AI_ASSISTANT_INSTRUCTIONS,
        input: buildCompactChatInput(message, context),
        maxOutputTokens: MAX_CHAT_AI_OUTPUT_TOKENS
      });

      for await (const event of stream) {
        if (closed || res.writableEnded) break;
        if (event.type === "response.output_text.delta" && event.delta) {
          streamedText += event.delta;
          writeSse(res, "delta", { delta: event.delta });
        }
      }

      if (!closed && !res.writableEnded) {
        writeSse(res, "done", { mode, model });
      }
    }

    try {
      if (isGroqReady()) {
        await streamProvider({ mode: "groq", model: env.groqModel, createStream: createGroqTextStream });
      } else {
        await streamProvider({ mode: "gemini", model: env.geminiModel, createStream: createGeminiTextStream });
      }
    } catch (error) {
      const primaryIssue = isGroqReady() ? describeGroqIssue(error) : describeGeminiIssue(error);
      if (!closed && !res.writableEnded) {
        if (!streamedText && isGroqReady() && isGeminiReady()) {
          try {
            await streamProvider({ mode: "gemini-after-groq", model: env.geminiModel, createStream: createGeminiTextStream });
          } catch (geminiError) {
            if (!streamedText && !res.writableEnded) {
              await streamFallbackReply(res, fallbackReply(message, context), "ai-fallback", {
                primary: primaryIssue,
                fallback: describeGeminiIssue(geminiError)
              });
            } else if (!res.writableEnded) {
              writeSse(res, "done", { mode: "gemini-partial", model: env.geminiModel, issue: describeGeminiIssue(geminiError) });
            }
          }
        } else if (!streamedText) {
          await streamFallbackReply(res, fallbackReply(message, context), isGroqReady() ? "groq-fallback" : "gemini-fallback", primaryIssue);
        } else {
          writeSse(res, "done", { mode: isGroqReady() ? "groq-partial" : "gemini-partial", model: isGroqReady() ? env.groqModel : env.geminiModel, issue: primaryIssue });
        }
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  })
);
