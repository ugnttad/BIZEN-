import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const employeeId = req.query.employeeId || req.user.employeeId;
    if (!employeeId) throw httpError(400, "employeeId is required");
    if (req.user.role === "Employee" && employeeId !== req.user.employeeId) {
      throw httpError(403, "Employees can only access their own notifications");
    }

    const result = await query(
      `SELECT id, title, body, notify_time AS time, type
       FROM notifications
       WHERE company_id = $1 AND employee_id = $2
       ORDER BY created_at DESC`,
      [companyId, employeeId]
    );
    res.json(result.rows);
  })
);
