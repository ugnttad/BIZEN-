import { query } from "../../config/db.js";

function userSelect(includePassword = false) {
  return `
    id,
    company_id AS "companyId",
    employee_id AS "employeeId",
    email,
    name,
    picture_url AS "pictureUrl",
    role,
    status,
    last_login_at AS "lastLoginAt",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
    ${includePassword ? ', password_hash AS "passwordHash"' : ""}
  `;
}

export async function findEmployeeByEmail(email) {
  const result = await query(
    `SELECT
      id,
      company_id AS "companyId",
      email,
      name,
      role
     FROM employees
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  );
  return result.rows[0];
}

export async function upsertGoogleUser(companyId, profile, employee, existingUser) {
  const role = existingUser?.role || employee?.role || "Employee";
  const employeeId = employee?.id || existingUser?.employeeId || null;
  const result = await query(
    `INSERT INTO app_users
      (company_id, employee_id, google_sub, email, name, picture_url, role, status, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Approved', now())
     ON CONFLICT (email) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      employee_id = EXCLUDED.employee_id,
      google_sub = EXCLUDED.google_sub,
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      picture_url = EXCLUDED.picture_url,
      role = EXCLUDED.role,
      last_login_at = now(),
      updated_at = now()
     RETURNING
      ${userSelect()}`,
    [companyId, employeeId, profile.sub, profile.email, profile.name, profile.picture, role]
  );
  return result.rows[0];
}

export async function getUserById(id) {
  const result = await query(
    `SELECT
      ${userSelect()}
     FROM app_users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function getUserByEmail(email, options = {}) {
  const result = await query(
    `SELECT
      ${userSelect(Boolean(options.includePassword))}
     FROM app_users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  );
  return result.rows[0];
}

export async function touchUserLogin(id) {
  const result = await query(
    `UPDATE app_users
     SET last_login_at = now(), updated_at = now()
     WHERE id = $1
     RETURNING ${userSelect()}`,
    [id]
  );
  return result.rows[0];
}

export async function upsertPasswordUser(companyId, employee, passwordHash = null, status = "Approved") {
  const result = await query(
    `INSERT INTO app_users
      (company_id, employee_id, google_sub, email, name, picture_url, password_hash, role, status, last_login_at)
     VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, now())
     ON CONFLICT (email) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      employee_id = EXCLUDED.employee_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      password_hash = COALESCE(EXCLUDED.password_hash, app_users.password_hash),
      status = EXCLUDED.status,
      last_login_at = now(),
      updated_at = now()
     RETURNING
      ${userSelect()}`,
    [companyId, employee.id, `password:${employee.id}`, employee.email, employee.name, passwordHash, employee.role, status]
  );
  return result.rows[0];
}

export async function createEmployeeAccountRequest(employee, passwordHash = null) {
  const result = await query(
    `INSERT INTO app_users
      (company_id, employee_id, google_sub, email, name, picture_url, password_hash, role, status, last_login_at)
     VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, 'Pending', now())
     ON CONFLICT (email) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      employee_id = EXCLUDED.employee_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      password_hash = CASE
        WHEN app_users.status = 'Approved' THEN app_users.password_hash
        ELSE COALESCE(EXCLUDED.password_hash, app_users.password_hash)
      END,
      status = CASE
        WHEN app_users.status = 'Approved' THEN app_users.status
        ELSE 'Pending'
      END,
      updated_at = now()
     RETURNING ${userSelect()}`,
    [employee.companyId, employee.id, `employee-request:${employee.id}`, employee.email, employee.name, passwordHash, employee.role]
  );
  return result.rows[0];
}

export async function listAccountRequests(companyId, status = "Pending") {
  const result = await query(
    `SELECT
      u.id,
      u.company_id AS "companyId",
      u.employee_id AS "employeeId",
      u.email,
      u.name,
      u.role,
      u.status,
      u.created_at AS "createdAt",
      u.updated_at AS "updatedAt",
      e.position,
      d.name AS department
     FROM app_users u
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE u.company_id = $1
       AND ($2 = 'All' OR u.status = $2)
     ORDER BY
      CASE u.status
        WHEN 'Pending' THEN 1
        WHEN 'Rejected' THEN 2
        WHEN 'Suspended' THEN 3
        ELSE 4
      END,
      u.created_at DESC`,
    [companyId, status]
  );
  return result.rows;
}

export async function reviewAccountRequest(companyId, id, status) {
  const result = await query(
    `UPDATE app_users
     SET status = $3, updated_at = now()
     WHERE id = $1 AND company_id = $2
     RETURNING ${userSelect()}`,
    [id, companyId, status]
  );
  return result.rows[0];
}
