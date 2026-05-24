import { Router } from "express";
import OpenAI from "openai";
import { env } from "../../config/env.js";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getBusinessDate } from "../../shared/businessDate.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const aiRouter = Router();

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

async function buildAiContext(companyId) {
  const today = getBusinessDate();
  const [summary, departments, lateEmployees, payrollDeductions, leaves, alerts] = await Promise.all([
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
      `SELECT e.name, d.name AS department, pi.deduction::int AS deduction, pi.final_salary::int AS "finalSalary", pi.status
       FROM payroll_items pi
       JOIN payroll_runs pr ON pr.id = pi.payroll_run_id
       JOIN employees e ON e.id = pi.employee_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE pr.company_id = $1 AND pr.month = '05/2026'
       ORDER BY pi.deduction DESC
       LIMIT 6`,
      [companyId]
    ),
    query(
      `SELECT lr.id, e.name AS employee, d.name AS department, lr.status, lr.days::float AS days, lr.reason
       FROM leave_requests lr
       JOIN employees e ON e.id = lr.employee_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE lr.company_id = $1
       ORDER BY lr.status DESC, lr.id DESC
       LIMIT 8`,
      [companyId]
    ),
    query("SELECT alert_type AS type, title, detail FROM ai_alerts WHERE company_id = $1 ORDER BY id", [companyId])
  ]);

  return {
    date: today,
    company: "Current company",
    summary: summary.rows[0],
    departments: departments.rows,
    lateEmployees: lateEmployees.rows,
    payrollDeductions: payrollDeductions.rows,
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

  if (lower.includes("lich") || lower.includes("xep")) {
    return "Dựa trên Neon, nên tránh xếp nhân viên đang có đơn nghỉ đã duyệt và ưu tiên bù cho ca thiếu người. Hiện cảnh báo lớn nhất là Warehouse thiếu nhân sự so với target.";
  }
  if (lower.includes("tre")) {
    return topLate ? `Nhóm đi trễ nhiều nhất hiện là: ${topLate}. Chủ sở hữu nên nhắc riêng và kiểm tra lại ca/địa điểm check-in.` : "Hiện chưa có dữ liệu đi trễ trong Neon.";
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

    if (!openai) {
      return res.json({ reply: fallbackReply(message, context), mode: "neon-fallback" });
    }

    try {
      const response = await openai.responses.create({
        model: env.openaiModel,
        instructions:
          "Bạn là BIZEN AI, trợ lý vận hành nhân sự/payroll trong hệ thống SaaS BIZEN. Trả lời bằng tiếng Việt, ngắn gọn, thực dụng. Chỉ dùng dữ liệu hệ thống được cung cấp; nếu thiếu dữ liệu, nói rõ là chưa đủ dữ liệu.",
        input: `Câu hỏi của người dùng: ${message}\n\nDữ liệu Neon hiện có:\n${JSON.stringify(context, null, 2)}`
      });

      res.json({ reply: response.output_text || fallbackReply(message, context), mode: "openai", model: env.openaiModel });
    } catch {
      res.json({ reply: fallbackReply(message, context), mode: "openai-fallback" });
    }
  })
);
