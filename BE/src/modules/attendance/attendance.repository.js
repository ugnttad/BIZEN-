import { query } from "../../config/db.js";

export async function listAttendance({ date = "2026-05-20" } = {}) {
  const result = await query(
    `SELECT
      a.employee_id AS "employeeId",
      a.check_in AS "checkIn",
      a.check_out AS "checkOut",
      a.total_hours::float AS "totalHours",
      a.status,
      COALESCE(a.location, '-') AS location,
      a.note,
      e.name AS "employeeName",
      d.name AS department
     FROM attendance_records a
     JOIN employees e ON e.id = a.employee_id
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE a.work_date = $1
     ORDER BY e.id`,
    [date]
  );
  return result.rows;
}

export async function upsertAttendance(companyId, data) {
  const result = await query(
    `INSERT INTO attendance_records
      (company_id, employee_id, work_date, check_in, check_out, total_hours, status, location, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (employee_id, work_date) DO UPDATE SET
      check_in = EXCLUDED.check_in,
      check_out = EXCLUDED.check_out,
      total_hours = EXCLUDED.total_hours,
      status = EXCLUDED.status,
      location = EXCLUDED.location,
      note = EXCLUDED.note
     RETURNING *`,
    [companyId, data.employeeId, data.workDate, data.checkIn, data.checkOut, data.totalHours || 0, data.status, data.location, data.note]
  );
  return result.rows[0];
}
