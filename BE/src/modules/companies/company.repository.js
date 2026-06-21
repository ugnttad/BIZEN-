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

export async function getCompanyById(companyId) {
  if (!companyId) return null;
  const result = await query(
    `SELECT
      id,
      name,
      city,
      business_type AS "businessType",
      business_address AS "businessAddress",
      tax_code AS "taxCode",
      website,
      created_at AS "createdAt"
     FROM companies
     WHERE id = $1
     LIMIT 1`,
    [companyId]
  );
  return result.rows[0] || null;
}
