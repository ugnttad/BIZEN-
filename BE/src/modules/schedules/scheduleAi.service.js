import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { env } from "../../config/env.js";
import { createParsedResponse } from "../ai/openai.service.js";

const aiScheduleResponseSchema = z.object({
  days: z.array(
    z.object({
      workDate: z.string(),
      shifts: z.array(
        z.object({
          shiftId: z.string(),
          employees: z.array(z.string())
        })
      )
    })
  ),
  reasons: z.array(z.string()),
  warnings: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

const scheduleTextFormat = zodTextFormat(aiScheduleResponseSchema, "bizen_schedule_plan");

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeWorkDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function byId(rows = []) {
  return new Map(rows.map((row) => [row.id, row]));
}

function getShiftRequired(shift) {
  return Number(shift?.required ?? shift?.requiredCount ?? 0);
}

function isEmployeeOnLeave(employeeId, workDate, leaves = []) {
  return leaves.find((leave) => leave.employeeId === employeeId && leave.status === "Approved" && leave.from <= workDate && workDate <= leave.to);
}

function isEmployeeBusy(employeeId, workDate, busyRows = []) {
  return busyRows.find((busy) => busy.employeeId === employeeId && normalizeWorkDate(busy.busyDate) === workDate);
}

function getUnavailable(employeeId, workDate, leaves, busyRows) {
  const leave = isEmployeeOnLeave(employeeId, workDate, leaves);
  if (leave) return { type: "Leave", label: `${leave.from} - ${leave.to}` };

  const busy = isEmployeeBusy(employeeId, workDate, busyRows);
  if (busy) return { type: "Busy", label: busy.displayDate || busy.busyDate };

  return null;
}

function makeCompleteDays(days = [], shifts = []) {
  return days.map((day) => {
    const slotsByShift = new Map((day.shifts || []).map((slot) => [slot.shiftId, unique(slot.employees || [])]));
    return {
      workDate: normalizeWorkDate(day.workDate || day.work_date),
      day: day.day,
      date: day.date,
      shifts: shifts.map((shift) => ({
        shiftId: shift.id,
        employees: slotsByShift.get(shift.id) || []
      }))
    };
  });
}

function scoreEmployee(employee, weekAssignmentCount, workload) {
  const stats = workload.get(employee.id) || {};
  return Number(weekAssignmentCount.get(employee.id) || 0) * 10 + Number(stats.recentHours || 0) + Number(stats.lateCount || 0) * 2;
}

function sanitizePlan(plan, context) {
  const shiftMap = byId(context.shifts);
  const activeEmployees = context.employees.filter((employee) => employee.status !== "Inactive");
  const employeeMap = byId(activeEmployees);
  const currentDays = makeCompleteDays(context.days, context.shifts);
  const plannedDayMap = new Map((plan.days || []).map((day) => [normalizeWorkDate(day.workDate), day]));
  const weekAssignmentCount = new Map();
  const warnings = [...(plan.warnings || [])];

  const days = currentDays.map((currentDay) => {
    const plannedDay = plannedDayMap.get(currentDay.workDate) || currentDay;
    const plannedSlots = new Map((plannedDay.shifts || []).map((slot) => [slot.shiftId, slot]));
    const assignedToday = new Set();

    const shifts = currentDay.shifts.map((currentSlot) => {
      const shift = shiftMap.get(currentSlot.shiftId);
      const required = getShiftRequired(shift);
      const proposed = unique((plannedSlots.get(currentSlot.shiftId) || currentSlot).employees || []);
      const employees = [];

      for (const employeeId of proposed) {
        if (employees.length >= required) break;
        if (!employeeMap.has(employeeId)) continue;
        if (assignedToday.has(employeeId)) continue;
        if (getUnavailable(employeeId, currentDay.workDate, context.leaves, context.busyRows)) continue;
        employees.push(employeeId);
        assignedToday.add(employeeId);
        weekAssignmentCount.set(employeeId, Number(weekAssignmentCount.get(employeeId) || 0) + 1);
      }

      if (employees.length < required) {
        const candidates = activeEmployees
          .filter((employee) => !assignedToday.has(employee.id))
          .filter((employee) => !getUnavailable(employee.id, currentDay.workDate, context.leaves, context.busyRows))
          .sort((left, right) => scoreEmployee(left, weekAssignmentCount, context.workload) - scoreEmployee(right, weekAssignmentCount, context.workload));

        for (const employee of candidates) {
          if (employees.length >= required) break;
          employees.push(employee.id);
          assignedToday.add(employee.id);
          weekAssignmentCount.set(employee.id, Number(weekAssignmentCount.get(employee.id) || 0) + 1);
        }
      }

      if (employees.length < required) {
        warnings.push(`${currentDay.day} ${currentDay.date} - ${shift?.name || currentSlot.shiftId} còn thiếu ${required - employees.length} người.`);
      }

      return {
        shiftId: currentSlot.shiftId,
        employees
      };
    });

    return {
      workDate: currentDay.workDate,
      day: currentDay.day,
      date: currentDay.date,
      shifts
    };
  });

  return {
    days,
    reasons: unique(plan.reasons || []).slice(0, 8),
    warnings: unique(warnings).slice(0, 8),
    confidence: typeof plan.confidence === "number" ? plan.confidence : 0.72
  };
}

function buildDeterministicPlan(context, warning = "") {
  const sanitized = sanitizePlan(
    {
      days: context.days,
      reasons: [
        "Đã giữ các phân công hợp lệ hiện có và tự động lấp các ca còn thiếu.",
        "Không xếp nhân viên inactive, đang nghỉ phép đã duyệt hoặc đã báo lịch bận.",
        "Mỗi nhân viên tối đa một ca mỗi ngày, ưu tiên người có workload gần đây thấp hơn."
      ],
      warnings: warning ? [warning] : []
    },
    context
  );

  return {
    ...sanitized,
    mode: "deterministic-fallback"
  };
}

function buildPlannerInput(context) {
  const workloadObject = Object.fromEntries(context.workload.entries());

  return {
    today: context.today,
    weekStart: context.weekStart,
    rules: [
      "Không tạo employeeId hoặc shiftId mới.",
      "Không xếp nhân viên Inactive.",
      "Không xếp nhân viên đã nghỉ phép Approved hoặc báo lịch bận vào đúng ngày đó.",
      "Một nhân viên tối đa một ca trong cùng một ngày.",
      "Cố gắng đạt required của từng shift, nhưng nếu thiếu người thật thì để thiếu và ghi warning.",
      "Ưu tiên giữ phân công hiện tại nếu hợp lệ, sau đó tối ưu cân bằng workload."
    ],
    shifts: context.shifts.map((shift) => ({
      id: shift.id,
      name: shift.name,
      time: shift.time,
      required: getShiftRequired(shift)
    })),
    employees: context.employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      department: employee.department,
      position: employee.position,
      status: employee.status,
      preferredShiftId: employee.shiftId,
      recentHours: workloadObject[employee.id]?.recentHours || 0,
      recentShifts: workloadObject[employee.id]?.recentShifts || 0,
      lateCount: workloadObject[employee.id]?.lateCount || 0
    })),
    currentSchedule: makeCompleteDays(context.days, context.shifts),
    unavailable: [
      ...context.leaves
        .filter((leave) => leave.status === "Approved")
        .map((leave) => ({
          type: "Leave",
          employeeId: leave.employeeId,
          from: leave.from,
          to: leave.to,
          reason: leave.reason || leave.type
        })),
      ...context.busyRows.map((busy) => ({
        type: "Busy",
        employeeId: busy.employeeId,
        date: normalizeWorkDate(busy.busyDate),
        reason: busy.reason || "Employee marked unavailable"
      }))
    ]
  };
}

export async function suggestSchedulePlan(context) {
  const fallback = buildDeterministicPlan(context);

  try {
    const response = await createParsedResponse({
      instructions:
        "Bạn là BIZEN AI Scheduling Planner cho SaaS quản trị nhân sự/quán dịch vụ. Hãy trả về JSON đúng schema, tối ưu lịch ca thực tế cho SME/hospitality, nói lý do bằng tiếng Việt ngắn gọn, và đặt confidence từ 0 đến 1. Không thêm dữ liệu ngoài context.",
      input: JSON.stringify(buildPlannerInput(context), null, 2),
      textFormat: scheduleTextFormat,
      maxOutputTokens: 2600
    });

    if (!response?.output_parsed) {
      return fallback;
    }

    const sanitized = sanitizePlan(response.output_parsed, context);
    return {
      ...sanitized,
      reasons: sanitized.reasons.length ? sanitized.reasons : fallback.reasons,
      mode: "openai",
      model: env.openaiModel
    };
  } catch (error) {
    return buildDeterministicPlan(context, `OpenAI planner chưa trả được lịch ổn định, đã dùng bộ tối ưu nội bộ. ${error.message || ""}`.trim());
  }
}
