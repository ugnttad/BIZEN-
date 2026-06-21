import webPush from "web-push";
import { env } from "../../config/env.js";
import { query, withTransaction } from "../../config/db.js";

let pushSchemaReady = false;
let pushSchemaPromise = null;
let webPushConfigured = false;

export function isPushConfigured() {
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey);
}

function configureWebPush() {
  if (!isPushConfigured()) return false;
  if (!webPushConfigured) {
    webPush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
    webPushConfigured = true;
  }
  return true;
}

export async function ensurePushSchema() {
  if (pushSchemaReady) return;
  if (!pushSchemaPromise) {
    pushSchemaPromise = withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('bizen'), hashtext('push_subscriptions_schema_v1'))");
      await client.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
          employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          user_agent TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await client.query("CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(company_id, user_id)");
      await client.query("CREATE INDEX IF NOT EXISTS idx_push_subscriptions_company ON push_subscriptions(company_id)");
    })
      .then(() => {
        pushSchemaReady = true;
      })
      .catch((error) => {
        pushSchemaPromise = null;
        throw error;
      });
  }

  await pushSchemaPromise;
}

export async function savePushSubscription({ companyId, user, subscription, userAgent }) {
  await ensurePushSchema();
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    const error = new Error("Push subscription không hợp lệ.");
    error.status = 400;
    throw error;
  }

  await query(
    `INSERT INTO push_subscriptions (company_id, user_id, employee_id, endpoint, p256dh, auth, user_agent, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (endpoint) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      user_id = EXCLUDED.user_id,
      employee_id = EXCLUDED.employee_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      user_agent = EXCLUDED.user_agent,
      updated_at = now()`,
    [companyId, user.id, user.employeeId || null, endpoint, p256dh, auth, userAgent || null]
  );
}

export async function deletePushSubscription(endpoint) {
  if (!endpoint) return;
  await ensurePushSchema();
  await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
}

function buildPushPayload(payload) {
  return JSON.stringify({
    title: payload.title || "BIZEN",
    body: payload.body || "Bạn có thông báo mới.",
    url: payload.url || "/mobile/community",
    tag: payload.tag || "bizen-notification",
    type: payload.type || "community"
  });
}

async function sendPushRows(rows, payload) {
  if (!rows.length || !configureWebPush()) return { sent: 0, skipped: rows.length };

  const body = buildPushPayload(payload);
  const results = await Promise.allSettled(
    rows.map((row) =>
      webPush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth
          }
        },
        body
      )
    )
  );

  const staleEndpoints = [];
  let sent = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      sent += 1;
      return;
    }
    const statusCode = result.reason?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      staleEndpoints.push(rows[index].endpoint);
    } else {
      console.warn(`[push:error] ${statusCode || "unknown"} ${result.reason?.message || result.reason}`);
    }
  });

  if (staleEndpoints.length) {
    await query("DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[])", [staleEndpoints]);
  }

  return { sent, skipped: rows.length - sent };
}

export async function sendPushToCompany(companyId, excludeUserId, payload) {
  if (!isPushConfigured()) return { sent: 0, skipped: 0 };
  await ensurePushSchema();
  const result = await query(
    `SELECT endpoint, p256dh, auth
     FROM push_subscriptions
     WHERE company_id = $1
       AND ($2::uuid IS NULL OR user_id IS DISTINCT FROM $2)`,
    [companyId, excludeUserId || null]
  );
  return sendPushRows(result.rows, payload);
}

export async function sendPushToUsers(companyId, userIds, payload) {
  const targetUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (!targetUserIds.length || !isPushConfigured()) return { sent: 0, skipped: 0 };
  await ensurePushSchema();
  const result = await query(
    `SELECT endpoint, p256dh, auth
     FROM push_subscriptions
     WHERE company_id = $1
       AND user_id = ANY($2::uuid[])`,
    [companyId, targetUserIds]
  );
  return sendPushRows(result.rows, payload);
}
