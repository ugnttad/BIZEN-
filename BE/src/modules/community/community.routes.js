import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const communityRouter = Router();

let communitySchemaReady = false;
let communitySchemaPromise = null;

async function ensureCommunitySchema() {
  if (communitySchemaReady) return;
  if (!communitySchemaPromise) {
    communitySchemaPromise = withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('bizen'), hashtext('community_schema_v1'))");
      await client.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT");
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          sender_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
          sender_employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
          body TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await client.query("CREATE INDEX IF NOT EXISTS idx_community_messages_company_created ON community_messages(company_id, created_at DESC)");
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_typing (
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          sender_user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
          sender_employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
          is_typing BOOLEAN NOT NULL DEFAULT false,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (company_id, sender_user_id)
        )
      `);
      await client.query("CREATE INDEX IF NOT EXISTS idx_community_typing_active ON community_typing(company_id, is_typing, updated_at DESC)");
    })
      .then(() => {
        communitySchemaReady = true;
      })
      .catch((error) => {
        communitySchemaPromise = null;
        throw error;
      });
  }

  await communitySchemaPromise;
}

const messageSchema = z.object({
  body: z.string().trim().min(1, "Tin nhắn không được để trống").max(1000, "Tin nhắn tối đa 1000 ký tự")
});

const typingSchema = z.object({
  isTyping: z.coerce.boolean()
});

function messageSelect() {
  return `
    SELECT
      m.id,
      m.body,
      m.created_at AS "createdAt",
      m.sender_user_id AS "senderUserId",
      m.sender_employee_id AS "senderEmployeeId",
      COALESCE(e.name, u.name, 'BIZEN User') AS "senderName",
      COALESCE(e.avatar_url, u.picture_url) AS "senderAvatarUrl",
      e.position AS "senderPosition",
      d.name AS "senderDepartment",
      u.role AS "senderRole"
    FROM community_messages m
    LEFT JOIN app_users u ON u.id = m.sender_user_id
    LEFT JOIN employees e ON e.id = m.sender_employee_id AND e.company_id = m.company_id
    LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
  `;
}

communityRouter.get(
  "/members",
  asyncHandler(async (req, res) => {
    await ensureCommunitySchema();
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `SELECT
        e.id,
        e.name,
        e.position,
        e.status,
        e.role,
        d.name AS department,
        e.avatar_url AS "avatarUrl"
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE e.company_id = $1 AND e.status <> 'Inactive'
       ORDER BY e.role DESC, e.name`,
      [companyId]
    );
    res.json(result.rows);
  })
);

communityRouter.get(
  "/messages",
  asyncHandler(async (req, res) => {
    await ensureCommunitySchema();
    const companyId = await getCompanyIdForUser(req.user);
    const limit = Math.min(Math.max(Number(req.query.limit || 80), 1), 120);
    const result = await query(
      `SELECT * FROM (
        ${messageSelect()}
        WHERE m.company_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2
      ) recent
      ORDER BY recent."createdAt" ASC`,
      [companyId, limit]
    );
    res.json(result.rows);
  })
);

communityRouter.post(
  "/messages",
  asyncHandler(async (req, res) => {
    await ensureCommunitySchema();
    const companyId = await getCompanyIdForUser(req.user);
    const data = messageSchema.parse(req.body ?? {});
    const inserted = await query(
      `INSERT INTO community_messages (company_id, sender_user_id, sender_employee_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [companyId, req.user.id, req.user.employeeId || null, data.body]
    );
    const result = await query(`${messageSelect()} WHERE m.company_id = $1 AND m.id = $2`, [companyId, inserted.rows[0].id]);
    res.status(201).json(result.rows[0]);
  })
);

communityRouter.get(
  "/typing",
  asyncHandler(async (req, res) => {
    await ensureCommunitySchema();
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `SELECT
        t.sender_user_id AS "senderUserId",
        t.sender_employee_id AS "senderEmployeeId",
        t.updated_at AS "updatedAt",
        COALESCE(e.name, u.name, 'BIZEN User') AS "senderName",
        COALESCE(e.avatar_url, u.picture_url) AS "senderAvatarUrl",
        e.position AS "senderPosition",
        d.name AS "senderDepartment"
       FROM community_typing t
       LEFT JOIN app_users u ON u.id = t.sender_user_id
       LEFT JOIN employees e ON e.id = t.sender_employee_id AND e.company_id = t.company_id
       LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
       WHERE t.company_id = $1
         AND t.sender_user_id IS DISTINCT FROM $2
         AND t.is_typing = true
         AND t.updated_at > now() - interval '6 seconds'
       ORDER BY t.updated_at DESC
       LIMIT 8`,
      [companyId, req.user.id]
    );
    res.json(result.rows);
  })
);

communityRouter.post(
  "/typing",
  asyncHandler(async (req, res) => {
    await ensureCommunitySchema();
    const companyId = await getCompanyIdForUser(req.user);
    const data = typingSchema.parse(req.body ?? {});
    await query(
      `INSERT INTO community_typing (company_id, sender_user_id, sender_employee_id, is_typing, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (company_id, sender_user_id) DO UPDATE SET
        sender_employee_id = EXCLUDED.sender_employee_id,
        is_typing = EXCLUDED.is_typing,
        updated_at = now()`,
      [companyId, req.user.id, req.user.employeeId || null, data.isTyping]
    );
    res.status(204).end();
  })
);
