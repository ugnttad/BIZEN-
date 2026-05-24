import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { requireRoles } from "../auth/auth.middleware.js";

export const leavesRouter = Router();

const leaveSchema = z.object({
  employeeId: z.string(),
  type: z.string().default("Annual leave"),
  from: z.string(),
  to: z.string(),
  days: z.coerce.number().positive(),
  reason: z.string().min(1),
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
    res.json(result.rows[0]);
  })
);
