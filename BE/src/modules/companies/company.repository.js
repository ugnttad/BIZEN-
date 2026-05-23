import { query } from "../../config/db.js";

let cachedCompanyId = null;

export async function getDefaultCompanyId() {
  if (cachedCompanyId) return cachedCompanyId;
  const result = await query("SELECT id FROM companies ORDER BY created_at ASC LIMIT 1");
  cachedCompanyId = result.rows[0]?.id;
  return cachedCompanyId;
}

export async function getCompanyIdForUser(user) {
  return user?.companyId || getDefaultCompanyId();
}
