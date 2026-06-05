import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { calculatePayrollItem } from "../../shared/payrollCalc.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { buildPayrollPreview, ensurePayrollAdjustmentSchema, getPayrollAdjustmentTotals, listPayrollAdjustments } from "./payroll.service.js";

export const payrollRouter = Router();

const payrollSelect = `
  SELECT
    pi.employee_id AS "employeeId",
    pr.month,
    COALESCE(pi.pay_type, 'Monthly') AS "payType",
    pi.base_salary::int AS "baseSalary",
    COALESCE(pi.hourly_rate, 0)::int AS "hourlyRate",
    pi.working_days::float AS "workingDays",
    COALESCE(pi.total_hours, 0)::float AS "totalHours",
    COALESCE(pi.regular_hours, 0)::float AS "regularHours",
    pi.overtime_hours::float AS "overtimeHours",
    pi.overtime_pay::int AS "overtimePay",
    pi.bonus::int AS bonus,
    COALESCE(pi.gross_salary, 0)::int AS "grossSalary",
    COALESCE(pi.bhxh_employee, 0)::int AS "bhxhEmployee",
    COALESCE(pi.bhyt_employee, 0)::int AS "bhytEmployee",
    COALESCE(pi.bhtn_employee, 0)::int AS "bhtnEmployee",
    COALESCE(pi.other_deduction, 0)::int AS "otherDeduction",
    COALESCE(adj.addition, 0)::int AS "manualAddition",
    COALESCE(adj.deduction, 0)::int AS "manualDeduction",
    GREATEST(COALESCE(pi.other_deduction, 0) - COALESCE(adj.deduction, 0), 0)::int AS "autoDeduction",
    COALESCE(adj.adjustment_count, 0)::int AS "adjustmentCount",
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
  LEFT JOIN (
    SELECT
      company_id,
      employee_id,
      month,
      COALESCE(SUM(amount) FILTER (WHERE kind = 'Addition'), 0)::int AS addition,
      COALESCE(SUM(amount) FILTER (WHERE kind = 'Deduction'), 0)::int AS deduction,
      COUNT(*)::int AS adjustment_count
    FROM payroll_adjustments
    GROUP BY company_id, employee_id, month
  ) adj ON adj.company_id = pr.company_id AND adj.employee_id = pi.employee_id AND adj.month = pr.month
`;

const calculateSchema = z.object({
  month: z.string().regex(/^(0[1-9]|1[0-2])\/20\d{2}$/).optional()
});

const adjustmentSchema = z.object({
  employeeId: z.string().trim().min(1),
  month: z.string().regex(/^(0[1-9]|1[0-2])\/20\d{2}$/).optional(),
  kind: z.enum(["Addition", "Deduction"]),
  category: z.string().trim().min(2).max(80),
  amount: z.coerce.number().int().positive().max(100000000),
  note: z.string().trim().max(500).optional().default("")
});

const updateAdjustmentSchema = adjustmentSchema.omit({ employeeId: true, month: true }).partial();

function parseMonth(month) {
  const [mm, yyyy] = month.split("/");
  return { start: `${yyyy}-${mm}-01`, endMonth: month };
}

function currentPayrollMonth(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function parsePayrollMonth(value) {
  const month = value || currentPayrollMonth();
  if (!/^(0[1-9]|1[0-2])\/20\d{2}$/.test(month)) {
    throw httpError(400, "Tháng lương cần có định dạng MM/YYYY");
  }
  return month;
}

function isPaidAttendance(row) {
  return ["Present", "Late", "Overtime"].includes(row.status) && row.checkOut;
}

function sumAttendanceHours(rows) {
  return Math.round(rows.filter(isPaidAttendance).reduce((sum, row) => sum + Number(row.totalHours || 0), 0) * 100) / 100;
}

payrollRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await ensurePayrollAdjustmentSchema();
    const month = parsePayrollMonth(req.query.month);
    const companyId = await getCompanyIdForUser(req.user);
    const employeeFilter = req.user.role === "Employee" ? " AND pi.employee_id = $3" : "";
    const params = req.user.role === "Employee" ? [companyId, month, req.user.employeeId] : [companyId, month];
    const result = await query(`${payrollSelect} WHERE pr.company_id = $1 AND pr.month = $2${employeeFilter} ORDER BY pi.employee_id`, params);
    if (!result.rows.length) {
      if (req.user.role === "Employee") {
        const preview = await buildPayrollPreview(companyId, req.user.employeeId, month);
        res.json([preview]);
        return;
      }

      const employees = await query(
        `SELECT id FROM employees WHERE company_id = $1 AND status = 'Active' ORDER BY id`,
        [companyId]
      );
      const previews = await Promise.all(employees.rows.map((employee) => buildPayrollPreview(companyId, employee.id, month)));
      res.json(previews);
      return;
    }
    res.json(result.rows);
  })
);

payrollRouter.post(
  "/calculate",
  asyncHandler(async (req, res) => {
    await ensurePayrollAdjustmentSchema();
    if (req.user.role !== "Admin") {
      throw httpError(403, "Chỉ chủ sở hữu được tính lương");
    }

    const { month } = calculateSchema.parse(req.body ?? {});
    const payrollMonth = month || currentPayrollMonth();
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
        `Chưa thể tính lương vì có ${openAttendances.rows.length} bản ghi thiếu check-out: ${sample}. Chủ sở hữu cần chốt giờ ra trước.`
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
      `SELECT
        id,
        pay_type AS "payType",
        base_salary::int AS "baseSalary",
        hourly_rate::int AS "hourlyRate"
       FROM employees
       WHERE company_id = $1 AND status = 'Active'`,
      [companyId]
    );

    let updated = 0;
    for (const employee of employees.rows) {
      const attendance = await query(
        `SELECT status, check_out AS "checkOut", total_hours::float AS "totalHours" FROM attendance_records
         WHERE company_id = $1 AND employee_id = $2
           AND work_date >= $3::date
           AND work_date < ($3::date + INTERVAL '1 month')`,
        [companyId, employee.id, start]
      );

      const workingDays = attendance.rows.filter(isPaidAttendance).length || 0;
      const totalHours = sumAttendanceHours(attendance.rows);
      const lateDays = attendance.rows.filter((row) => row.status === "Late").length;
      const lateDeduction = lateDays * 50000;

      const overtimeHours = Math.max(0, attendance.rows.filter((row) => row.status === "Overtime" && row.checkOut).length * 2);
      const adjustmentTotals = await getPayrollAdjustmentTotals(companyId, employee.id, payrollMonth);
      const bonus = adjustmentTotals.addition;
      const otherDeduction = lateDeduction + adjustmentTotals.deduction;

      const calc = calculatePayrollItem({
        payType: employee.payType,
        baseSalary: employee.baseSalary,
        hourlyRate: employee.hourlyRate,
        workingDays: workingDays || 0,
        totalHours,
        overtimeHours,
        bonus,
        otherDeduction
      });

      await query(
        `INSERT INTO payroll_items
          (payroll_run_id, employee_id, pay_type, base_salary, hourly_rate, working_days, total_hours, regular_hours, overtime_hours, overtime_pay, bonus,
           gross_salary, bhxh_employee, bhyt_employee, bhtn_employee, other_deduction, deduction, final_salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'Draft')
         ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET
          pay_type = EXCLUDED.pay_type,
          base_salary = EXCLUDED.base_salary,
          hourly_rate = EXCLUDED.hourly_rate,
          working_days = EXCLUDED.working_days,
          total_hours = EXCLUDED.total_hours,
          regular_hours = EXCLUDED.regular_hours,
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
          calc.payType,
          employee.baseSalary,
          employee.hourlyRate,
          calc.workingDays ?? workingDays,
          calc.totalHours,
          calc.regularHours,
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
  "/adjustments",
  asyncHandler(async (req, res) => {
    const month = parsePayrollMonth(req.query.month);
    const companyId = await getCompanyIdForUser(req.user);
    const employeeId = req.user.role === "Employee" ? req.user.employeeId : req.query.employeeId || null;
    res.json(await listPayrollAdjustments(companyId, month, employeeId));
  })
);

payrollRouter.post(
  "/adjustments",
  asyncHandler(async (req, res) => {
    if (req.user.role !== "Admin") {
      throw httpError(403, "Chỉ chủ sở hữu được nhập chi phí lương");
    }

    await ensurePayrollAdjustmentSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const data = adjustmentSchema.parse(req.body ?? {});
    const month = parsePayrollMonth(data.month);
    const employee = await query("SELECT id FROM employees WHERE company_id = $1 AND id = $2 LIMIT 1", [companyId, data.employeeId]);
    if (!employee.rows[0]) {
      throw httpError(404, "Không tìm thấy nhân viên trong doanh nghiệp này");
    }

    const result = await query(
      `INSERT INTO payroll_adjustments (company_id, employee_id, month, kind, category, amount, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [companyId, data.employeeId, month, data.kind, data.category, data.amount, data.note, req.user.id || null]
    );
    const rows = await listPayrollAdjustments(companyId, month, data.employeeId);
    res.status(201).json(rows.find((item) => item.id === result.rows[0].id) || rows[0]);
  })
);

payrollRouter.patch(
  "/adjustments/:id",
  asyncHandler(async (req, res) => {
    if (req.user.role !== "Admin") {
      throw httpError(403, "Chỉ chủ sở hữu được sửa chi phí lương");
    }

    await ensurePayrollAdjustmentSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const data = updateAdjustmentSchema.parse(req.body ?? {});
    const current = await query("SELECT id, month, employee_id FROM payroll_adjustments WHERE company_id = $1 AND id = $2", [companyId, req.params.id]);
    if (!current.rows[0]) {
      throw httpError(404, "Không tìm thấy chi phí lương");
    }

    await query(
      `UPDATE payroll_adjustments
       SET
        kind = COALESCE($3, kind),
        category = COALESCE($4, category),
        amount = COALESCE($5, amount),
        note = COALESCE($6, note),
        updated_at = now()
       WHERE company_id = $1 AND id = $2`,
      [companyId, req.params.id, data.kind, data.category, data.amount, data.note]
    );
    const rows = await listPayrollAdjustments(companyId, current.rows[0].month, current.rows[0].employee_id);
    res.json(rows.find((item) => item.id === req.params.id));
  })
);

payrollRouter.delete(
  "/adjustments/:id",
  asyncHandler(async (req, res) => {
    if (req.user.role !== "Admin") {
      throw httpError(403, "Chỉ chủ sở hữu được xóa chi phí lương");
    }

    await ensurePayrollAdjustmentSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query("DELETE FROM payroll_adjustments WHERE company_id = $1 AND id = $2 RETURNING id", [companyId, req.params.id]);
    if (!result.rows[0]) {
      throw httpError(404, "Không tìm thấy chi phí lương");
    }
    res.status(204).end();
  })
);

payrollRouter.get(
  "/:employeeId",
  asyncHandler(async (req, res) => {
    await ensurePayrollAdjustmentSchema();
    const month = parsePayrollMonth(req.query.month);
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
      res.json({
        ...row,
        adjustments: await listPayrollAdjustments(companyId, month, req.params.employeeId)
      });
      return;
    }

    const preview = await buildPayrollPreview(companyId, req.params.employeeId, month);
    res.json(preview);
  })
);
