import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const profileRouter = Router();

let profileSchemaReady = false;
let profileSchemaPromise = null;

async function ensureProfileSchema() {
  if (profileSchemaReady) return;
  if (!profileSchemaPromise) {
    profileSchemaPromise = withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('bizen'), hashtext('profile_schema_v1'))");
      await client.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT");
      await client.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS picture_url TEXT");
    })
      .then(() => {
        profileSchemaReady = true;
      })
      .catch((error) => {
        profileSchemaPromise = null;
        throw error;
      });
  }

  await profileSchemaPromise;
}

const avatarSchema = z
  .string()
  .trim()
  .max(900000, "Ảnh đại diện quá lớn")
  .refine((value) => !value || value.startsWith("data:image/") || /^https?:\/\//i.test(value), "Ảnh đại diện cần là ảnh upload hoặc URL ảnh hợp lệ")
  .optional();

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(160).optional(),
  avatarUrl: avatarSchema
});

function userSelect() {
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
  `;
}

async function getEmployeeProfile(companyId, employeeId) {
  if (!employeeId) return null;
  const result = await query(
    `SELECT
      e.id,
      e.company_id AS "companyId",
      e.name,
      d.name AS department,
      e.department_id AS "departmentId",
      e.position,
      e.role,
      e.contract_type AS "contractType",
      e.status,
      e.email,
      e.phone,
      e.address,
      e.avatar_url AS "avatarUrl"
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
     WHERE e.company_id = $1 AND e.id = $2`,
    [companyId, employeeId]
  );
  return result.rows[0] || null;
}

profileRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await ensureProfileSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const employee = await getEmployeeProfile(companyId, req.user.employeeId);
    res.json({
      user: req.user,
      employee
    });
  })
);

profileRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    await ensureProfileSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const data = updateProfileSchema.parse(req.body ?? {});
    const nextName = data.name || req.user.name;

    if (req.user.employeeId) {
      const current = await getEmployeeProfile(companyId, req.user.employeeId);
      if (!current) throw httpError(404, "Không tìm thấy hồ sơ nhân viên");

      await query(
        `UPDATE employees
         SET
          name = COALESCE($3, name),
          phone = COALESCE($4, phone),
          address = COALESCE($5, address),
          avatar_url = COALESCE($6, avatar_url),
          updated_at = now()
         WHERE company_id = $1 AND id = $2`,
        [companyId, req.user.employeeId, data.name, data.phone, data.address, data.avatarUrl]
      );
    }

    const userResult = await query(
      `UPDATE app_users
       SET
        name = $3,
        picture_url = COALESCE($4, picture_url),
        updated_at = now()
       WHERE company_id = $1 AND id = $2
       RETURNING ${userSelect()}`,
      [companyId, req.user.id, nextName, data.avatarUrl]
    );

    const user = userResult.rows[0];
    const employee = await getEmployeeProfile(companyId, req.user.employeeId);
    res.json({ user, employee });
  })
);
