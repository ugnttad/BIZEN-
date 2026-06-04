import { query, withTransaction } from "../../config/db.js";
import { httpError } from "../../shared/httpError.js";
import { calculatePayrollItem } from "../../shared/payrollCalc.js";

let payrollAdjustmentSchemaReady = false;
let payrollAdjustmentSchemaPromise = null;

export async function ensurePayrollAdjustmentSchema() {
  if (payrollAdjustmentSchemaReady) return;
  if (!payrollAdjustmentSchemaPromise) {
    payrollAdjustmentSchemaPromise = withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('bizen'), hashtext('payroll_adjustments_v1'))");
      await client.query(`
        CREATE TABLE IF NOT EXISTS payroll_adjustments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
          month TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('Addition', 'Deduction')),
          category TEXT NOT NULL,
          amount NUMERIC(14, 0) NOT NULL CHECK (amount > 0),
          note TEXT NOT NULL DEFAULT '',
          created_by UUID,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await client.query("CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_company_month ON payroll_adjustments(company_id, month)");
      await client.query("CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_employee_month ON payroll_adjustments(employee_id, month)");
    })
      .then(() => {
        payrollAdjustmentSchemaReady = true;
      })
      .catch((error) => {
        payrollAdjustmentSchemaPromise = null;
        throw error;
      });
  }

  await payrollAdjustmentSchemaPromise;
}

function parseMonth(month) {
  const [mm, yyyy] = month.split("/");
  return `${yyyy}-${mm}-01`;
}

export async function listPayrollAdjustments(companyId, month, employeeId = null) {
  await ensurePayrollAdjustmentSchema();
  const params = employeeId ? [companyId, month, employeeId] : [companyId, month];
  const employeeFilter = employeeId ? "AND pa.employee_id = $3" : "";
  const result = await query(
    `SELECT
      pa.id,
      pa.employee_id AS "employeeId",
      e.name AS "employeeName",
      d.name AS department,
      pa.month,
      pa.kind,
      pa.category,
      pa.amount::int AS amount,
      pa.note,
      pa.created_at AS "createdAt",
      pa.updated_at AS "updatedAt"
     FROM payroll_adjustments pa
     JOIN employees e ON e.id = pa.employee_id AND e.company_id = pa.company_id
     LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
     WHERE pa.company_id = $1 AND pa.month = $2 ${employeeFilter}
     ORDER BY pa.created_at DESC, e.name`,
    params
  );
  return result.rows;
}

export async function getPayrollAdjustmentTotals(companyId, employeeId, month) {
  await ensurePayrollAdjustmentSchema();
  const result = await query(
    `SELECT
      COALESCE(SUM(amount) FILTER (WHERE kind = 'Addition'), 0)::int AS addition,
      COALESCE(SUM(amount) FILTER (WHERE kind = 'Deduction'), 0)::int AS deduction,
      COUNT(*)::int AS count
     FROM payroll_adjustments
     WHERE company_id = $1 AND employee_id = $2 AND month = $3`,
    [companyId, employeeId, month]
  );
  return result.rows[0] || { addition: 0, deduction: 0, count: 0 };
}

export async function buildPayrollPreview(companyId, employeeId, month) {
  await ensurePayrollAdjustmentSchema();
  const employee = await query(
    `SELECT e.id, e.base_salary::int AS "baseSalary", e.name, d.name AS department
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
     WHERE e.id = $1 AND e.company_id = $2`,
    [employeeId, companyId]
  );
  if (!employee.rows[0]) {
    throw httpError(404, "Không tìm thấy nhân viên");
  }

  const start = parseMonth(month);
  const attendance = await query(
    `SELECT status, check_out AS "checkOut" FROM attendance_records
     WHERE company_id = $1 AND employee_id = $2
       AND work_date >= $3::date
       AND work_date < ($3::date + INTERVAL '1 month')`,
    [companyId, employeeId, start]
  );

  const workingDays = attendance.rows.filter((row) => ["Present", "Late", "Overtime"].includes(row.status) && row.checkOut).length;
  const lateDays = attendance.rows.filter((row) => row.status === "Late").length;
  const missingCheckoutDays = attendance.rows.filter((row) => ["Present", "Late", "Overtime"].includes(row.status) && !row.checkOut).length;
  const lateDeduction = lateDays * 50000;
  const overtimeHours = Math.max(0, attendance.rows.filter((row) => row.status === "Overtime").length * 2);
  const adjustmentTotals = await getPayrollAdjustmentTotals(companyId, employeeId, month);
  const adjustments = await listPayrollAdjustments(companyId, month, employeeId);

  const calc = calculatePayrollItem({
    baseSalary: employee.rows[0].baseSalary,
    workingDays,
    overtimeHours,
    bonus: adjustmentTotals.addition,
    otherDeduction: lateDeduction + adjustmentTotals.deduction
  });

  return {
    employeeId,
    month,
    baseSalary: employee.rows[0].baseSalary,
    workingDays,
    overtimeHours,
    overtimePay: calc.overtimePay,
    bonus: adjustmentTotals.addition,
    grossSalary: calc.grossSalary,
    bhxhEmployee: calc.bhxhEmployee,
    bhytEmployee: calc.bhytEmployee,
    bhtnEmployee: calc.bhtnEmployee,
    otherDeduction: calc.otherDeduction,
    autoLateDeduction: lateDeduction,
    manualAddition: adjustmentTotals.addition,
    manualDeduction: adjustmentTotals.deduction,
    adjustmentCount: adjustmentTotals.count,
    adjustments,
    insuranceDeduction: calc.insuranceDeduction,
    deduction: calc.deduction,
    finalSalary: calc.finalSalary,
    status: "Draft",
    employeeName: employee.rows[0].name,
    department: employee.rows[0].department,
    isEstimate: true,
    needsPayrollReview: missingCheckoutDays > 0,
    missingCheckoutDays
  };
}
