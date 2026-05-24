import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { calculatePayrollItem } from "../../shared/payrollCalc.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { buildPayrollPreview } from "./payroll.service.js";

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
    COALESCE(pi.gross_salary, 0)::int AS "grossSalary",
    COALESCE(pi.bhxh_employee, 0)::int AS "bhxhEmployee",
    COALESCE(pi.bhyt_employee, 0)::int AS "bhytEmployee",
    COALESCE(pi.bhtn_employee, 0)::int AS "bhtnEmployee",
    COALESCE(pi.other_deduction, 0)::int AS "otherDeduction",
    COALESCE(pi.bhxh_employee, 0)::int + COALESCE(pi.bhyt_employee, 0)::int + COALESCE(pi.bhtn_employee, 0)::int AS "insuranceDeduction",
    pi.deduction::int AS deduction,
    pi.final_salary::int AS "finalSalary",
    pi.status,
    e.name AS "employeeName",
    d.name AS department
  FROM payroll_items pi
  JOIN payroll_runs pr ON pr.id = pi.payroll_run_id
  JOIN employees e ON e.id = pi.employee_id
  LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
`;

const calculateSchema = z.object({
  month: z.string().regex(/^\d{2}\/\d{4}$/).optional()
});

function parseMonth(month) {
  const [mm, yyyy] = month.split("/");
  return { start: `${yyyy}-${mm}-01`, endMonth: month };
}

payrollRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const month = req.query.month || "05/2026";
    const companyId = await getCompanyIdForUser(req.user);
    const employeeFilter = req.user.role === "Employee" ? " AND pi.employee_id = $3" : "";
    const params = req.user.role === "Employee" ? [companyId, month, req.user.employeeId] : [companyId, month];
    const result = await query(`${payrollSelect} WHERE pr.company_id = $1 AND pr.month = $2${employeeFilter} ORDER BY pi.employee_id`, params);
    res.json(result.rows);
  })
);

payrollRouter.post(
  "/calculate",
  asyncHandler(async (req, res) => {
    if (req.user.role === "Employee") {
      throw httpError(403, "Chỉ Admin/HR được tính lương");
    }

    const { month } = calculateSchema.parse(req.body ?? {});
    const payrollMonth = month || "05/2026";
    const companyId = await getCompanyIdForUser(req.user);
    const { start } = parseMonth(payrollMonth);

    const openAttendances = await query(
      `SELECT e.name, a.employee_id AS "employeeId", to_char(a.work_date, 'DD/MM/YYYY') AS "workDate", a.check_in AS "checkIn"
       FROM attendance_records a
       JOIN employees e ON e.id = a.employee_id
       WHERE a.company_id = $1
         AND a.work_date >= $2::date
         AND a.work_date < ($2::date + INTERVAL '1 month')
         AND a.check_in IS NOT NULL
         AND a.check_out IS NULL
         AND a.status IN ('Present', 'Late', 'Overtime')
       ORDER BY a.work_date, e.name
       LIMIT 8`,
      [companyId, start]
    );

    if (openAttendances.rows.length) {
      const sample = openAttendances.rows.map((row) => `${row.name} (${row.workDate}, vào ${row.checkIn})`).join(", ");
      throw httpError(
        409,
        `Chưa thể tính lương vì có ${openAttendances.rows.length} bản ghi thiếu check-out: ${sample}. Admin/HR cần chốt giờ ra trước.`
      );
    }

    const run = await query(
      `INSERT INTO payroll_runs (company_id, month, status)
       VALUES ($1, $2, 'Draft')
       ON CONFLICT (company_id, month) DO UPDATE SET status = 'Draft'
       RETURNING id`,
      [companyId, payrollMonth]
    );
    const payrollRunId = run.rows[0].id;

    const employees = await query(
      `SELECT id, base_salary::int AS "baseSalary"
       FROM employees
       WHERE company_id = $1 AND status = 'Active'`,
      [companyId]
    );

    let updated = 0;
    for (const employee of employees.rows) {
      const attendance = await query(
        `SELECT status FROM attendance_records
         WHERE company_id = $1 AND employee_id = $2
           AND work_date >= $3::date
           AND work_date < ($3::date + INTERVAL '1 month')`,
        [companyId, employee.id, start]
      );

      const workingDays = attendance.rows.filter((row) => ["Present", "Late", "Overtime"].includes(row.status)).length || 0;
      const lateDays = attendance.rows.filter((row) => row.status === "Late").length;
      const otherDeduction = lateDays * 50000;

      const overtimeHours = Math.max(0, attendance.rows.filter((row) => row.status === "Overtime").length * 2);
      const bonus = 0;

      const calc = calculatePayrollItem({
        baseSalary: employee.baseSalary,
        workingDays: workingDays || 0,
        overtimeHours,
        bonus,
        otherDeduction
      });

      await query(
        `INSERT INTO payroll_items
          (payroll_run_id, employee_id, base_salary, working_days, overtime_hours, overtime_pay, bonus,
           gross_salary, bhxh_employee, bhyt_employee, bhtn_employee, other_deduction, deduction, final_salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Draft')
         ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET
          working_days = EXCLUDED.working_days,
          overtime_hours = EXCLUDED.overtime_hours,
          overtime_pay = EXCLUDED.overtime_pay,
          bonus = EXCLUDED.bonus,
          gross_salary = EXCLUDED.gross_salary,
          bhxh_employee = EXCLUDED.bhxh_employee,
          bhyt_employee = EXCLUDED.bhyt_employee,
          bhtn_employee = EXCLUDED.bhtn_employee,
          other_deduction = EXCLUDED.other_deduction,
          deduction = EXCLUDED.deduction,
          final_salary = EXCLUDED.final_salary,
          status = 'Draft'`,
        [
          payrollRunId,
          employee.id,
          employee.baseSalary,
          calc.workingDays ?? workingDays,
          overtimeHours,
          calc.overtimePay,
          bonus,
          calc.grossSalary,
          calc.bhxhEmployee,
          calc.bhytEmployee,
          calc.bhtnEmployee,
          calc.otherDeduction,
          calc.deduction,
          calc.finalSalary
        ]
      );
      updated += 1;
    }

    const result = await query(`${payrollSelect} WHERE pr.company_id = $1 AND pr.month = $2 ORDER BY pi.employee_id`, [companyId, payrollMonth]);
    res.json({ month: payrollMonth, updated, items: result.rows });
  })
);

payrollRouter.get(
  "/:employeeId",
  asyncHandler(async (req, res) => {
    const month = req.query.month || "05/2026";
    const companyId = await getCompanyIdForUser(req.user);
    if (req.user.role === "Employee" && req.params.employeeId !== req.user.employeeId) {
      throw httpError(403, "Nhân viên chỉ xem được bảng lương của mình");
    }

    const result = await query(`${payrollSelect} WHERE pr.company_id = $1 AND pr.month = $2 AND pi.employee_id = $3`, [
      companyId,
      month,
      req.params.employeeId
    ]);
    const row = result.rows[0];
    if (row) {
      res.json(row);
      return;
    }

    const preview = await buildPayrollPreview(companyId, req.params.employeeId, month);
    res.json(preview);
  })
);
