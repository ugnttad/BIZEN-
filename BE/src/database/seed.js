import { pool, withTransaction } from "../config/db.js";
import { assertEnv } from "../config/env.js";
import { attendanceToday, departments, employees, shifts, scheduleWeek, leaveRequests, notifications, aiAlerts } from "./seedData.js";

assertEnv();

function calculatePayroll(employee, index) {
  const workingDays = [22, 21, 22, 20, 0, 22, 22, 21, 22, 18, 22, 22, 22, 22, 0, 22, 21, 22, 20, 22][index];
  const overtimeHours = [4, 0, 2, 7, 0, 1, 0, 0, 3, 0, 8, 2, 4, 1, 0, 5, 0, 1, 2, 9][index];
  const bonus = [1200000, 400000, 600000, 300000, 0, 900000, 300000, 200000, 700000, 0, 650000, 350000, 1500000, 500000, 0, 800000, 200000, 250000, 100000, 900000][index];
  const deduction = [0, 350000, 0, 0, 480000, 0, 0, 420000, 0, 900000, 0, 0, 0, 0, 460000, 0, 380000, 0, 0, 0][index];
  const statuses = ["Paid", "Draft", "Reviewed", "Approved", "Draft", "Paid", "Reviewed", "Reviewed", "Approved", "Draft", "Paid", "Reviewed", "Paid", "Approved", "Draft", "Reviewed", "Draft", "Reviewed", "Draft", "Approved"];
  const baseSalary = Number(employee[6]);
  const dailyRate = baseSalary / 22;
  const overtimePay = Math.round(overtimeHours * (dailyRate / 8) * 1.5);
  const finalSalary = Math.round(dailyRate * workingDays + overtimePay + bonus - deduction);

  return { workingDays, overtimeHours, overtimePay, bonus, deduction, finalSalary, status: statuses[index] };
}

await withTransaction(async (client) => {
  const existingCompany = await client.query("SELECT id FROM companies WHERE name = $1 LIMIT 1", ["BIZEN Demo Company"]);
  let companyId = existingCompany.rows[0]?.id;
  if (!companyId) {
    const companyResult = await client.query(
      `INSERT INTO companies (name, city)
       VALUES ($1, $2)
       RETURNING id`,
      ["BIZEN Demo Company", "Da Nang"]
    );
    companyId = companyResult.rows[0].id;
  }

  for (const department of departments) {
    await client.query(
      `INSERT INTO departments (id, company_id, name, target_headcount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, target_headcount = EXCLUDED.target_headcount`,
      [department.id, companyId, department.name, department.targetHeadcount]
    );
  }

  for (const shift of shifts) {
    await client.query(
      `INSERT INTO shifts (id, company_id, name, time_range, short_time, required_count, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, time_range = EXCLUDED.time_range, required_count = EXCLUDED.required_count`,
      [shift[0], companyId, shift[1], shift[2], shift[3], shift[4], shift[5]]
    );
  }

  for (const employee of employees) {
    await client.query(
      `INSERT INTO employees
        (id, company_id, name, department_id, position, role, contract_type, base_salary, status, email, phone, start_date, manager_name, shift_id, leave_remaining, address)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        department_id = EXCLUDED.department_id,
        position = EXCLUDED.position,
        role = EXCLUDED.role,
        contract_type = EXCLUDED.contract_type,
        base_salary = EXCLUDED.base_salary,
        status = EXCLUDED.status,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        start_date = EXCLUDED.start_date,
        manager_name = EXCLUDED.manager_name,
        shift_id = EXCLUDED.shift_id,
        leave_remaining = EXCLUDED.leave_remaining,
        address = EXCLUDED.address,
        updated_at = now()`,
      [employee[0], companyId, ...employee.slice(1)]
    );
  }

  for (const record of attendanceToday) {
    await client.query(
      `INSERT INTO attendance_records
        (company_id, employee_id, work_date, check_in, check_out, total_hours, status, location, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (employee_id, work_date) DO UPDATE SET
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        total_hours = EXCLUDED.total_hours,
        status = EXCLUDED.status,
        location = EXCLUDED.location,
        note = EXCLUDED.note`,
      [companyId, record[0], "2026-05-20", ...record.slice(1)]
    );
  }

  const attendanceHistory = [
    ["BZN017", "2026-05-19", "12:58", "21:02", 8.1, "Present", "Thanh Khê", "Đúng giờ"],
    ["BZN017", "2026-05-18", "13:04", "21:00", 7.9, "Present", "Thanh Khê", "Đúng giờ"],
    ["BZN017", "2026-05-17", "17:55", "22:06", 4.2, "Overtime", "Sơn Trà", "OT 12 phút"]
  ];

  for (const record of attendanceHistory) {
    await client.query(
      `INSERT INTO attendance_records
        (company_id, employee_id, work_date, check_in, check_out, total_hours, status, location, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (employee_id, work_date) DO UPDATE SET
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        total_hours = EXCLUDED.total_hours,
        status = EXCLUDED.status,
        location = EXCLUDED.location,
        note = EXCLUDED.note`,
      [companyId, ...record]
    );
  }

  for (const day of scheduleWeek) {
    const dayResult = await client.query(
      `INSERT INTO schedule_days (company_id, work_date, label, display_date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, work_date) DO UPDATE SET label = EXCLUDED.label, display_date = EXCLUDED.display_date
       RETURNING id`,
      [companyId, day[0], day[1], day[2]]
    );

    for (const slot of day[3]) {
      await client.query(
        `INSERT INTO schedule_slots (schedule_day_id, shift_id, employee_ids)
         VALUES ($1, $2, $3)
         ON CONFLICT (schedule_day_id, shift_id) DO UPDATE SET employee_ids = EXCLUDED.employee_ids`,
        [dayResult.rows[0].id, slot[0], slot[1]]
      );
    }
  }

  const payrollRun = await client.query(
    `INSERT INTO payroll_runs (company_id, month, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (company_id, month) DO UPDATE SET status = EXCLUDED.status
     RETURNING id`,
    [companyId, "05/2026", "Reviewed"]
  );

  for (const [index, employee] of employees.entries()) {
    const payroll = calculatePayroll(employee, index);
    await client.query(
      `INSERT INTO payroll_items
        (payroll_run_id, employee_id, base_salary, working_days, overtime_hours, overtime_pay, bonus, deduction, final_salary, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        working_days = EXCLUDED.working_days,
        overtime_hours = EXCLUDED.overtime_hours,
        overtime_pay = EXCLUDED.overtime_pay,
        bonus = EXCLUDED.bonus,
        deduction = EXCLUDED.deduction,
        final_salary = EXCLUDED.final_salary,
        status = EXCLUDED.status`,
      [payrollRun.rows[0].id, employee[0], employee[6], payroll.workingDays, payroll.overtimeHours, payroll.overtimePay, payroll.bonus, payroll.deduction, payroll.finalSalary, payroll.status]
    );
  }

  for (const request of leaveRequests) {
    await client.query(
      `INSERT INTO leave_requests
        (id, company_id, employee_id, leave_type, from_date, to_date, days, reason, status, approver)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason`,
      [request[0], companyId, ...request.slice(1)]
    );
  }

  for (const notification of notifications) {
    await client.query(
      `INSERT INTO notifications (company_id, employee_id, title, body, notify_time, type)
       SELECT $1, $2, $3, $4, $5, $6
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications WHERE company_id = $1 AND employee_id = $2 AND title = $3 AND body = $4
       )`,
      [companyId, ...notification]
    );
  }

  await client.query("DELETE FROM ai_alerts WHERE company_id = $1", [companyId]);
  for (const alert of aiAlerts) {
    await client.query(
      `INSERT INTO ai_alerts (company_id, alert_type, title, detail) VALUES ($1, $2, $3, $4)`,
      [companyId, ...alert]
    );
  }

  await client.query(
    `INSERT INTO app_settings
      (company_id, work_start, work_end, late_grace_minutes, payroll_formula, overtime_formula, annual_leave_days)
     VALUES ($1, '08:00', '17:00', 10, $2, $3, 12)
     ON CONFLICT (company_id) DO UPDATE SET
      late_grace_minutes = EXCLUDED.late_grace_minutes,
      payroll_formula = EXCLUDED.payroll_formula,
      overtime_formula = EXCLUDED.overtime_formula`,
    [companyId, "Base salary / 22 x working days + OT + bonus - deduction", "Hourly rate x 150%"]
  );
});

await pool.end();

console.log("Database seed completed.");
