import { query } from "../../config/db.js";
import { getBusinessDate } from "../../shared/businessDate.js";

export async function listAttendance({ date = getBusinessDate(), companyId } = {}) {
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
     WHERE a.company_id = $1 AND a.work_date = $2
     ORDER BY e.id`,
    [companyId, date]
  );
  return result.rows;
}

export async function listEmployeeAttendance(employeeId, companyId) {
  const result = await query(
    `SELECT
      to_char(a.work_date, 'DD/MM/YYYY') AS date,
      COALESCE(sh.name, 'Ca làm') AS shift,
      COALESCE(a.check_in, '-') AS "checkIn",
      COALESCE(a.check_out, '-') AS "checkOut",
      a.total_hours::float AS hours,
      a.status,
      COALESCE(a.location, '-') AS location,
      a.note
     FROM attendance_records a
     JOIN employees e ON e.id = a.employee_id
     LEFT JOIN shifts sh ON sh.id = e.shift_id
     WHERE a.employee_id = $1 AND a.company_id = $2
     ORDER BY a.work_date DESC
     LIMIT 30`,
    [employeeId, companyId]
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

export async function getAttendanceRecord(employeeId, workDate, companyId) {
  const result = await query(
    `SELECT
      employee_id AS "employeeId",
      to_char(work_date, 'YYYY-MM-DD') AS "workDate",
      check_in AS "checkIn",
      check_out AS "checkOut",
      total_hours::float AS "totalHours",
      status,
      location,
      note
     FROM attendance_records
     WHERE employee_id = $1 AND work_date = $2 AND ($3::uuid IS NULL OR company_id = $3)`,
    [employeeId, workDate, companyId || null]
  );
  return result.rows[0];
}

export async function getEmployeeAttendanceContext(employeeId) {
  const result = await query(
    `SELECT
      e.id AS "employeeId",
      e.name AS "employeeName",
      e.company_id AS "companyId",
      COALESCE(sh.short_time, settings.work_start, '08:00') AS "shiftStart",
      COALESCE(sh.time_range, settings.work_start || ' - ' || settings.work_end, '08:00 - 17:00') AS "shiftTime",
      COALESCE(settings.late_grace_minutes, 10)::int AS "lateGraceMinutes"
     FROM employees e
     LEFT JOIN shifts sh ON sh.id = e.shift_id
     LEFT JOIN app_settings settings ON settings.company_id = e.company_id
     WHERE e.id = $1`,
    [employeeId]
  );
  return result.rows[0];
}

export async function getApprovedFaceEnrollment(employeeId) {
  const result = await query(
    `SELECT
      id::text,
      employee_id AS "employeeId",
      status,
      rekognition_face_id AS "rekognitionFaceId",
      rekognition_collection_id AS "rekognitionCollectionId"
     FROM face_enrollments
     WHERE employee_id = $1 AND status = 'Approved'
     ORDER BY reviewed_at DESC NULLS LAST, requested_at DESC
     LIMIT 1`,
    [employeeId]
  );
  return result.rows[0];
}
