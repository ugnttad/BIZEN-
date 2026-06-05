import { createHash, randomBytes } from "crypto";
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

let accountRequestSchemaReady = false;
let passwordResetSchemaReady = false;

function hashResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function ensureAccountRequestSchema() {
  if (accountRequestSchemaReady) return;

  await query(`
    ALTER TABLE app_users
      ADD COLUMN IF NOT EXISTS request_full_name TEXT,
      ADD COLUMN IF NOT EXISTS request_phone TEXT,
      ADD COLUMN IF NOT EXISTS request_citizen_id TEXT,
      ADD COLUMN IF NOT EXISTS request_date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS request_address TEXT,
      ADD COLUMN IF NOT EXISTS request_note TEXT;
  `);
  accountRequestSchemaReady = true;
}

async function ensurePasswordResetSchema() {
  if (passwordResetSchemaReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
      ON password_reset_tokens(user_id, created_at DESC);
  `);
  passwordResetSchemaReady = true;
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

export async function updateEmployeeAccountProfile(companyId, employee) {
  const result = await query(
    `UPDATE app_users
     SET
      email = $3,
      name = $4,
      role = $5,
      updated_at = now()
     WHERE company_id = $1 AND employee_id = $2
     RETURNING ${userSelect()}`,
    [companyId, employee.id, employee.email, employee.name, employee.role]
  );
  return result.rows[0];
}

export async function listAccountRequests(companyId, status = "Pending") {
  await ensureAccountRequestSchema();

  const result = await query(
    `SELECT
      u.id,
      u.company_id AS "companyId",
      u.employee_id AS "employeeId",
      u.email,
      u.name,
      u.request_full_name AS "requestFullName",
      u.request_phone AS "requestPhone",
      u.request_citizen_id AS "requestCitizenId",
      u.request_date_of_birth AS "requestDateOfBirth",
      u.request_address AS "requestAddress",
      u.request_note AS "requestNote",
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

export async function createPasswordResetToken(userId) {
  await ensurePasswordResetSchema();

  const token = randomBytes(32).toString("base64url");
  await query(
    `DELETE FROM password_reset_tokens
     WHERE user_id = $1 OR expires_at < now() OR used_at IS NOT NULL`,
    [userId]
  );
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '30 minutes')`,
    [userId, hashResetToken(token)]
  );
  return token;
}

export async function resetPasswordWithToken(token, passwordHash) {
  await ensurePasswordResetSchema();

  const result = await query(
    `WITH token_row AS (
       UPDATE password_reset_tokens
       SET used_at = now()
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > now()
       RETURNING user_id
     ),
     updated_user AS (
       UPDATE app_users
       SET password_hash = $2,
           updated_at = now()
       WHERE id = (SELECT user_id FROM token_row)
         AND status = 'Approved'
       RETURNING ${userSelect()}
     )
     SELECT * FROM updated_user`,
    [hashResetToken(token), passwordHash]
  );
  return result.rows[0];
}
