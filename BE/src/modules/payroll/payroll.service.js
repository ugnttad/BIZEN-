import { query } from "../../config/db.js";
import { httpError } from "../../shared/httpError.js";
import { calculatePayrollItem } from "../../shared/payrollCalc.js";

function parseMonth(month) {
  const [mm, yyyy] = month.split("/");
  return `${yyyy}-${mm}-01`;
}

export async function buildPayrollPreview(companyId, employeeId, month) {
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
  const otherDeduction = lateDays * 50000;
  const overtimeHours = Math.max(0, attendance.rows.filter((row) => row.status === "Overtime").length * 2);

  const calc = calculatePayrollItem({
    baseSalary: employee.rows[0].baseSalary,
    workingDays,
    overtimeHours,
    bonus: 0,
    otherDeduction
  });

  return {
    employeeId,
    month,
    baseSalary: employee.rows[0].baseSalary,
    workingDays,
    overtimeHours,
    overtimePay: calc.overtimePay,
    bonus: 0,
    grossSalary: calc.grossSalary,
    bhxhEmployee: calc.bhxhEmployee,
    bhytEmployee: calc.bhytEmployee,
    bhtnEmployee: calc.bhtnEmployee,
    otherDeduction: calc.otherDeduction,
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
