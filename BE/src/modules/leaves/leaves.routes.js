import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getBusinessDate } from "../../shared/businessDate.js";
import { httpError } from "../../shared/httpError.js";
import { compareIsoDates, isIsoDate } from "../../shared/validation.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { requireRoles } from "../auth/auth.middleware.js";

export const leavesRouter = Router();

const leaveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["Annual leave", "Sick leave", "Unpaid leave"]).default("Annual leave"),
  from: z.string().refine(isIsoDate, "Ngày bắt đầu chưa hợp lệ"),
  to: z.string().refine(isIsoDate, "Ngày kết thúc chưa hợp lệ"),
  days: z.coerce.number().positive().max(14),
  reason: z.string().trim().min(1).max(300),
  approver: z.string().optional()
});

leavesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const employeeFilter = req.user.role === "Employee" ? " AND lr.employee_id = $2" : "";
    const params = req.user.role === "Employee" ? [companyId, req.user.employeeId] : [companyId];
    const result = await query(
      `SELECT
        lr.id,
        lr.employee_id AS "employeeId",
        e.name AS "employeeName",
        d.name AS department,
        lr.leave_type AS type,
        to_char(lr.from_date, 'DD/MM/YYYY') AS "from",
        to_char(lr.to_date, 'DD/MM/YYYY') AS "to",
        lr.days::float AS days,
        lr.reason,
        lr.status,
        lr.approver
       FROM leave_requests lr
       JOIN employees e ON e.id = lr.employee_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE lr.company_id = $1${employeeFilter}
       ORDER BY lr.id DESC`,
      params
    );
    res.json(result.rows);
  })
);

leavesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = leaveSchema.parse(req.body);
    const companyId = await getCompanyIdForUser(req.user);
    if (req.user.role === "Employee" && data.employeeId !== req.user.employeeId) {
      throw httpError(403, "Employees can only create leave requests for themselves");
    }
    if (compareIsoDates(data.from, data.to) > 0) {
      throw httpError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }
    const today = getBusinessDate();
    if (compareIsoDates(data.from, today) < 0) {
      throw httpError(400, "Không thể gửi đơn nghỉ cho ngày đã qua");
    }
    const calendarDays = Math.floor(compareIsoDates(data.to, data.from) / 86400000) + 1;
    if (data.days > calendarDays) {
      throw httpError(400, "Số ngày nghỉ không được lớn hơn khoảng ngày đã chọn");
    }

    const employee = await query("SELECT id, leave_remaining::float AS \"leaveRemaining\" FROM employees WHERE id = $1 AND company_id = $2", [
      data.employeeId,
      companyId
    ]);
    if (!employee.rows[0]) {
      throw httpError(404, "Không tìm thấy nhân viên trong doanh nghiệp này");
    }
    if (data.type === "Annual leave" && data.days > employee.rows[0].leaveRemaining) {
      throw httpError(400, "Số ngày nghỉ phép năm vượt quá số ngày còn lại");
    }

    const overlap = await query(
      `SELECT id FROM leave_requests
       WHERE company_id = $1
         AND employee_id = $2
         AND status IN ('Pending', 'Approved')
         AND NOT (to_date < $3::date OR from_date > $4::date)
       LIMIT 1`,
      [companyId, data.employeeId, data.from, data.to]
    );
    if (overlap.rows[0]) {
      throw httpError(409, "Nhân viên đã có đơn nghỉ trùng khoảng thời gian này");
    }

    const count = await query("SELECT COUNT(*)::int + 1001 AS next FROM leave_requests");
    const id = `LR-${count.rows[0].next}`;
    const result = await query(
      `INSERT INTO leave_requests
        (id, company_id, employee_id, leave_type, from_date, to_date, days, reason, status, approver)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9)
       RETURNING *`,
      [id, companyId, data.employeeId, data.type, data.from, data.to, data.days, data.reason, data.approver || "Chủ sở hữu"]
    );
    res.status(201).json(result.rows[0]);
  })
);

leavesRouter.patch(
  "/:id/status",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    const status = z.enum(["Pending", "Approved", "Rejected"]).parse(req.body.status);
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query("UPDATE leave_requests SET status = $2 WHERE id = $1 AND company_id = $3 RETURNING *", [req.params.id, status, companyId]);
    if (!result.rows[0]) throw httpError(404, "Không tìm thấy đơn nghỉ phép");
    res.json(result.rows[0]);
  })
);
