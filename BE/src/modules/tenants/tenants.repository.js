import { query, withTransaction } from "../../config/db.js";

const requestSelect = `
  id,
  company_name AS "companyName",
  city,
  contact_name AS "contactName",
  contact_email AS "contactEmail",
  phone,
  status,
  company_id AS "companyId",
  reviewed_by AS "reviewedBy",
  rejection_reason AS "rejectionReason",
  requested_at AS "requestedAt",
  reviewed_at AS "reviewedAt",
  updated_at AS "updatedAt"
`;

const defaultDepartments = [
  ["phuc-vu", "Phục vụ", 8],
  ["pha-che", "Pha chế / Bar", 4],
  ["bep", "Bếp", 6],
  ["thu-ngan", "Thu ngân", 3],
  ["le-tan", "Lễ tân", 3],
  ["buong-phong", "Buồng phòng", 5],
  ["nhan-su", "Nhân sự", 2]
];

const defaultShifts = [
  ["ca-sang", "Ca sáng", "07:00 - 15:00", "07:00", 6, "#2563eb"],
  ["ca-chieu", "Ca chiều", "14:00 - 22:00", "14:00", 6, "#7c3aed"],
  ["ca-toi", "Ca tối", "17:00 - 23:00", "17:00", 5, "#4f46e5"],
  ["ca-gay", "Ca gãy (F&B)", "10:00 - 14:00, 17:00 - 21:00", "10:00", 4, "#059669"]
];

async function createCompanyDefaults(client, companyId) {
  const suffix = companyId.slice(0, 8);

  for (const [key, name, targetHeadcount] of defaultDepartments) {
    await client.query(
      `INSERT INTO departments (id, company_id, name, target_headcount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [`${suffix}-${key}`, companyId, name, targetHeadcount]
    );
  }

  for (const [key, name, timeRange, shortTime, requiredCount, color] of defaultShifts) {
    await client.query(
      `INSERT INTO shifts (id, company_id, name, time_range, short_time, required_count, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [`${suffix}-${key}`, companyId, name, timeRange, shortTime, requiredCount, color]
    );
  }

  await client.query(
    `INSERT INTO app_settings
      (company_id, work_start, work_end, late_grace_minutes, payroll_formula, overtime_formula, annual_leave_days)
     VALUES ($1, '08:00', '17:00', 10, $2, $3, 12)
     ON CONFLICT (company_id) DO NOTHING`,
    [
      companyId,
      "Lương gross = (lương CB/22 x ngày công) + OT + thưởng; trừ BHXH 8% + BHYT 1.5% + BHTN 1% + phạt",
      "Lương giờ x 150%"
    ]
  );
}

export async function createCompanyAccessRequest(data) {
  const result = await query(
    `INSERT INTO company_access_requests
      (company_name, city, contact_name, contact_email, phone, admin_password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${requestSelect}`,
    [data.companyName, data.city, data.contactName, data.contactEmail, data.phone || null, data.adminPasswordHash]
  );
  return result.rows[0];
}

export async function listCompanyAccessRequests(status = "Pending") {
  const result = await query(
    `SELECT ${requestSelect}
     FROM company_access_requests
     WHERE $1 = 'All' OR status = $1
     ORDER BY requested_at DESC`,
    [status]
  );
  return result.rows;
}

export async function reviewCompanyAccessRequest(id, data) {
  return withTransaction(async (client) => {
    const current = await client.query(
      `SELECT *
       FROM company_access_requests
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );
    const request = current.rows[0];
    if (!request) return null;

    if (data.status === "Rejected") {
      const rejected = await client.query(
        `UPDATE company_access_requests
         SET status = 'Rejected',
          reviewed_by = $2,
          rejection_reason = $3,
          reviewed_at = now(),
          updated_at = now()
         WHERE id = $1
         RETURNING ${requestSelect}`,
        [id, data.reviewedBy, data.rejectionReason || null]
      );
      return rejected.rows[0];
    }

    const company = await client.query(
      `INSERT INTO companies (name, city)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET city = EXCLUDED.city
       RETURNING id`,
      [request.company_name, request.city]
    );
    const companyId = company.rows[0].id;
    await createCompanyDefaults(client, companyId);

    await client.query(
      `INSERT INTO app_users
        (company_id, employee_id, google_sub, email, name, picture_url, password_hash, role, status, last_login_at)
       VALUES ($1, NULL, $2, $3, $4, NULL, $5, 'Admin', 'Approved', now())
       ON CONFLICT (email) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        employee_id = NULL,
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = 'Admin',
        status = 'Approved',
        updated_at = now()
       RETURNING id`,
      [companyId, `company-admin:${request.contact_email.toLowerCase()}`, request.contact_email, request.contact_name, request.admin_password_hash]
    );

    const approved = await client.query(
      `UPDATE company_access_requests
       SET status = 'Approved',
        company_id = $2,
        reviewed_by = $3,
        rejection_reason = NULL,
        reviewed_at = now(),
        updated_at = now()
       WHERE id = $1
       RETURNING ${requestSelect}`,
      [id, companyId, data.reviewedBy]
    );
    return approved.rows[0];
  });
}
