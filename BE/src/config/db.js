import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

let pool;

function createDatabaseConfigError() {
  const error = new Error(
    "DATABASE_URL is not configured on the backend deployment. Set DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL in Vercel Environment Variables and redeploy."
  );
  error.status = 503;
  error.code = "DATABASE_NOT_CONFIGURED";
  return error;
}

function shouldUseSsl(databaseUrl) {
  try {
    const hostname = new URL(databaseUrl).hostname;
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return true;
  }
}

export function isDatabaseConfigured() {
  return Boolean(env.databaseUrl);
}

export function getPool() {
  if (!env.databaseUrl) {
    throw createDatabaseConfigError();
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: shouldUseSsl(env.databaseUrl) ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

export async function query(text, params = []) {
  const result = await getPool().query(text, params);
  return result;
}

export async function withTransaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
