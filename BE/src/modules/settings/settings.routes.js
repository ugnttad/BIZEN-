import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { isTime } from "../../shared/validation.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const settingsRouter = Router();

const settingsSchema = z.object({
  workStart: z.string().refine(isTime, "Giờ bắt đầu chưa hợp lệ"),
  workEnd: z.string().refine(isTime, "Giờ kết thúc chưa hợp lệ"),
  lateGraceMinutes: z.coerce.number().int().min(0).max(60),
  payrollFormula: z.string().trim().min(5).max(500),
  overtimeFormula: z.string().trim().min(5).max(300),
  annualLeaveDays: z.coerce.number().int().min(0).max(24)
});

settingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `SELECT
        work_start AS "workStart",
        work_end AS "workEnd",
        late_grace_minutes AS "lateGraceMinutes",
        payroll_formula AS "payrollFormula",
        overtime_formula AS "overtimeFormula",
        annual_leave_days AS "annualLeaveDays"
       FROM app_settings WHERE company_id = $1`,
      [companyId]
    );
    res.json(result.rows[0]);
  })
);

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);
    if (data.workStart === data.workEnd) {
      throw httpError(400, "Giờ bắt đầu và giờ kết thúc không được trùng nhau");
    }
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `UPDATE app_settings SET
        work_start = $2,
        work_end = $3,
        late_grace_minutes = $4,
        payroll_formula = $5,
        overtime_formula = $6,
        annual_leave_days = $7
       WHERE company_id = $1
       RETURNING
        work_start AS "workStart",
        work_end AS "workEnd",
        late_grace_minutes AS "lateGraceMinutes",
        payroll_formula AS "payrollFormula",
        overtime_formula AS "overtimeFormula",
        annual_leave_days AS "annualLeaveDays"`,
      [companyId, data.workStart, data.workEnd, data.lateGraceMinutes, data.payrollFormula, data.overtimeFormula, data.annualLeaveDays]
    );
    res.json(result.rows[0]);
  })
);
