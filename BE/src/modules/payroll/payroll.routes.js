import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";

export const payrollRouter = Router();

const payrollSelect = `
  SELECT
    pi.employee_id AS "employeeId",
    pr.month,
    pi.base_salary::int AS "baseSalary",
    pi.working_days::float AS "workingDays",
    pi.overtime_hours::float AS "overtimeHours",
    pi.overtime_pay::int AS "overtimePay",
    pi.bonus::int AS bonus,
    pi.deduction::int AS deduction,
    pi.final_salary::int AS "finalSalary",
    pi.status,
    e.name AS "employeeName",
    d.name AS department
  FROM payroll_items pi
  JOIN payroll_runs pr ON pr.id = pi.payroll_run_id
  JOIN employees e ON e.id = pi.employee_id
  LEFT JOIN departments d ON d.id = e.department_id
`;

payrollRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const month = req.query.month || "05/2026";
    const result = await query(`${payrollSelect} WHERE pr.month = $1 ORDER BY pi.employee_id`, [month]);
    res.json(result.rows);
  })
);

payrollRouter.get(
  "/:employeeId",
  asyncHandler(async (req, res) => {
    const month = req.query.month || "05/2026";
    const result = await query(`${payrollSelect} WHERE pr.month = $1 AND pi.employee_id = $2`, [month, req.params.employeeId]);
    const row = result.rows[0];
    if (!row) throw httpError(404, "Payroll item not found");
    res.json(row);
  })
);
