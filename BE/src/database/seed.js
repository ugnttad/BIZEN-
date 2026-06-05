import { closePool, withTransaction } from "../config/db.js";
import { assertEnv } from "../config/env.js";
import { calculatePayrollItem } from "../shared/payrollCalc.js";
import { attendanceToday, departments, employees, shifts, scheduleWeek, leaveRequests, notifications, aiAlerts } from "./seedData.js";

assertEnv();

function getEmployeePaySettings(employee) {
  const payType = String(employee[5]).toLowerCase().includes("part") ? "Hourly" : "Monthly";
  const seedSalary = Number(employee[6]);
  return {
    payType,
    baseSalary: payType === "Hourly" ? 0 : seedSalary,
    hourlyRate: payType === "Hourly" ? Math.max(10000, Math.round(seedSalary / 120 / 1000) * 1000) : 0
  };
}

function calculatePayroll(employee, index) {
  const workingDays = [22, 21, 22, 20, 0, 22, 22, 21, 22, 18, 22, 22, 22, 22, 0, 22, 21, 22, 20, 22][index];
  const overtimeHours = [4, 0, 2, 7, 0, 1, 0, 0, 3, 0, 8, 2, 4, 1, 0, 5, 0, 1, 2, 9][index];
  const bonus = [1200000, 400000, 600000, 300000, 0, 900000, 300000, 200000, 700000, 0, 650000, 350000, 1500000, 500000, 0, 800000, 200000, 250000, 100000, 900000][index];
  const otherDeduction = [0, 150000, 0, 0, 200000, 0, 0, 120000, 0, 300000, 0, 0, 0, 0, 180000, 0, 100000, 0, 0, 0][index];
  const statuses = ["Paid", "Draft", "Reviewed", "Approved", "Draft", "Paid", "Reviewed", "Reviewed", "Approved", "Draft", "Paid", "Reviewed", "Paid", "Approved", "Draft", "Reviewed", "Draft", "Reviewed", "Draft", "Approved"];
  const pay = getEmployeePaySettings(employee);
  const totalHours = pay.payType === "Hourly" ? workingDays * 4 + overtimeHours : workingDays * 8 + overtimeHours;
  const calc = calculatePayrollItem({
    payType: pay.payType,
    baseSalary: pay.baseSalary,
    hourlyRate: pay.hourlyRate,
    workingDays,
    totalHours,
    overtimeHours,
    bonus,
    otherDeduction: otherDeduction[index]
  });

  return {
    payType: calc.payType,
    baseSalary: calc.baseSalary,
    hourlyRate: calc.hourlyRate,
    workingDays,
    totalHours: calc.totalHours,
    regularHours: calc.regularHours,
    overtimeHours,
    overtimePay: calc.overtimePay,
    bonus,
    grossSalary: calc.grossSalary,
    bhxhEmployee: calc.bhxhEmployee,
    bhytEmployee: calc.bhytEmployee,
    bhtnEmployee: calc.bhtnEmployee,
    otherDeduction: calc.otherDeduction,
    deduction: calc.deduction,
    finalSalary: calc.finalSalary,
    status: statuses[index]
  };
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
    const pay = getEmployeePaySettings(employee);
    await client.query(
      `INSERT INTO employees
        (id, company_id, name, department_id, position, role, contract_type, pay_type, base_salary, hourly_rate, status, email, phone, start_date, manager_name, shift_id, leave_remaining, address)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        department_id = EXCLUDED.department_id,
        position = EXCLUDED.position,
        role = EXCLUDED.role,
        contract_type = EXCLUDED.contract_type,
        pay_type = EXCLUDED.pay_type,
        base_salary = EXCLUDED.base_salary,
        hourly_rate = EXCLUDED.hourly_rate,
        status = EXCLUDED.status,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        start_date = EXCLUDED.start_date,
        manager_name = EXCLUDED.manager_name,
        shift_id = EXCLUDED.shift_id,
        leave_remaining = EXCLUDED.leave_remaining,
        address = EXCLUDED.address,
        updated_at = now()`,
      [
        employee[0],
        companyId,
        employee[1],
        employee[2],
        employee[3],
        employee[4],
        employee[5],
        pay.payType,
        pay.baseSalary,
        pay.hourlyRate,
        employee[7],
        employee[8],
        employee[9],
        employee[10],
        employee[11],
        employee[12],
        employee[13],
        employee[14]
      ]
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
        (payroll_run_id, employee_id, pay_type, base_salary, hourly_rate, working_days, total_hours, regular_hours, overtime_hours, overtime_pay, bonus,
         gross_salary, bhxh_employee, bhyt_employee, bhtn_employee, other_deduction, deduction, final_salary, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
        status = EXCLUDED.status`,
      [
        payrollRun.rows[0].id,
        employee[0],
        payroll.payType,
        payroll.baseSalary,
        payroll.hourlyRate,
        payroll.workingDays,
        payroll.totalHours,
        payroll.regularHours,
        payroll.overtimeHours,
        payroll.overtimePay,
        payroll.bonus,
        payroll.grossSalary,
        payroll.bhxhEmployee,
        payroll.bhytEmployee,
        payroll.bhtnEmployee,
        payroll.otherDeduction,
        payroll.deduction,
        payroll.finalSalary,
        payroll.status
      ]
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
      (company_id, work_start, work_end, late_grace_minutes, payroll_formula, overtime_formula, annual_leave_days, store_address, store_latitude, store_longitude, geofence_radius_meters, geofence_enabled)
     VALUES ($1, '08:00', '17:00', 10, $2, $3, 12, 'Hải Châu, Đà Nẵng', 16.0678000, 108.2208000, 200, true)
     ON CONFLICT (company_id) DO UPDATE SET
      late_grace_minutes = EXCLUDED.late_grace_minutes,
      payroll_formula = EXCLUDED.payroll_formula,
      overtime_formula = EXCLUDED.overtime_formula,
      store_address = COALESCE(app_settings.store_address, EXCLUDED.store_address),
      store_latitude = COALESCE(app_settings.store_latitude, EXCLUDED.store_latitude),
      store_longitude = COALESCE(app_settings.store_longitude, EXCLUDED.store_longitude),
      geofence_radius_meters = COALESCE(app_settings.geofence_radius_meters, EXCLUDED.geofence_radius_meters),
      geofence_enabled = COALESCE(app_settings.geofence_enabled, EXCLUDED.geofence_enabled)`,
    [companyId, "Base salary / 22 x working days + OT + bonus - deduction", "Hourly rate x 150%"]
  );
});

await closePool();

console.log("Database seed completed.");
