import { query } from "../../config/db.js";

export async function findEmployeeByEmail(email) {
  const result = await query(
    `SELECT id, role FROM employees WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return result.rows[0];
}

export async function upsertGoogleUser(companyId, profile, employee) {
  const role = employee?.role || "Employee";
  const employeeId = employee?.id || null;
  const result = await query(
    `INSERT INTO app_users
      (company_id, employee_id, google_sub, email, name, picture_url, role, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (google_sub) DO UPDATE SET
      employee_id = EXCLUDED.employee_id,
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      picture_url = EXCLUDED.picture_url,
      role = EXCLUDED.role,
      last_login_at = now(),
      updated_at = now()
     RETURNING
      id,
      employee_id AS "employeeId",
      email,
      name,
      picture_url AS "pictureUrl",
      role,
      last_login_at AS "lastLoginAt"`,
    [companyId, employeeId, profile.sub, profile.email, profile.name, profile.picture, role]
  );
  return result.rows[0];
}

export async function getUserById(id) {
  const result = await query(
    `SELECT
      id,
      employee_id AS "employeeId",
      email,
      name,
      picture_url AS "pictureUrl",
      role,
      last_login_at AS "lastLoginAt"
     FROM app_users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}
