import { query, withTransaction } from "../../config/db.js";
import { httpError } from "../../shared/httpError.js";
import { normalizeEmail, normalizePhone } from "../../shared/validation.js";

const requestSelect = `
  id,
  company_name AS "companyName",
  city,
  contact_name AS "contactName",
  contact_email AS "contactEmail",
  phone,
  employee_count AS "employeeCount",
  status,
  company_id AS "companyId",
  reviewed_by AS "reviewedBy",
  rejection_reason AS "rejectionReason",
  requested_at AS "requestedAt",
  reviewed_at AS "reviewedAt",
  updated_at AS "updatedAt"
`;

const defaultDepartments = [
  { key: "quan-ly-cua-hang", name: "Quản lý cửa hàng", defaultCount: 1, minAt: 1 },
  { key: "pha-che", name: "Pha chế", defaultCount: 5, minAt: 2 },
  { key: "thu-ngan", name: "Thu ngân", defaultCount: 3, minAt: 4 },
  { key: "phuc-vu-order", name: "Phục vụ / Order", defaultCount: 6, minAt: 3 },
  { key: "topping-bep-nhe", name: "Topping / Bếp nhẹ", defaultCount: 3, minAt: 7 },
  { key: "kho-tap-vu", name: "Kho / Tạp vụ", defaultCount: 2, minAt: 9 }
];

const defaultShifts = [
  { key: "ca-sang", name: "Ca sáng", timeRange: "07:00 - 15:00", shortTime: "07:00", defaultCount: 5, minAt: 1, color: "#2563eb" },
  { key: "ca-chieu", name: "Ca chiều", timeRange: "14:00 - 22:00", shortTime: "14:00", defaultCount: 5, minAt: 2, color: "#7c3aed" },
  { key: "ca-toi", name: "Ca tối", timeRange: "17:00 - 23:00", shortTime: "17:00", defaultCount: 4, minAt: 4, color: "#4f46e5" },
  { key: "ca-gay", name: "Ca gãy giờ cao điểm", timeRange: "10:00 - 14:00, 17:00 - 21:00", shortTime: "10:00", defaultCount: 3, minAt: 8, color: "#059669" }
];

let tenantSchemaReady = false;

async function ensureTenantSchema(executor = query) {
  if (tenantSchemaReady) return;

  const sql = `
    ALTER TABLE company_access_requests
      ADD COLUMN IF NOT EXISTS employee_count INTEGER NOT NULL DEFAULT 20;
  `;

  if (typeof executor === "function") {
    await executor(sql);
  } else {
    await executor.query(sql);
  }

  tenantSchemaReady = true;
}

function normalizeEmployeeCount(value) {
  const count = Number(value || 10);
  if (!Number.isFinite(count)) return 10;
  return Math.min(20, Math.max(1, Math.round(count)));
}

function allocateCounts(templates, desiredTotal) {
  const total = normalizeEmployeeCount(desiredTotal);
  const rows = templates.map((template) => ({
    ...template,
    count: total >= template.minAt ? 1 : 0
  }));
  let remaining = total - rows.reduce((sum, row) => sum + row.count, 0);
  const eligible = rows.filter((row) => total >= row.minAt);

  while (remaining > 0 && eligible.length) {
    eligible
      .sort((left, right) => left.count / left.defaultCount - right.count / right.defaultCount || right.defaultCount - left.defaultCount);
    const next = eligible.find((row) => row.count < row.defaultCount) || eligible[0];
    next.count += 1;
    remaining -= 1;
  }

  return rows;
}

function buildDepartmentTargets(employeeCount) {
  return allocateCounts(defaultDepartments, employeeCount);
}

function buildShiftRequirements(employeeCount) {
  const count = normalizeEmployeeCount(employeeCount);
  const dailyCoverage = Math.max(1, Math.min(count, Math.ceil(count * 0.85)));
  return allocateCounts(defaultShifts, dailyCoverage);
}

async function createCompanyDefaults(client, companyId, employeeCount = 10) {
  const suffix = companyId.slice(0, 8);

  for (const { key, name, count } of buildDepartmentTargets(employeeCount)) {
    await client.query(
      `INSERT INTO departments (id, company_id, name, target_headcount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [`${suffix}-${key}`, companyId, name, count]
    );
  }

  for (const { key, name, timeRange, shortTime, count, color } of buildShiftRequirements(employeeCount)) {
    await client.query(
      `INSERT INTO shifts (id, company_id, name, time_range, short_time, required_count, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [`${suffix}-${key}`, companyId, name, timeRange, shortTime, count, color]
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
  await ensureTenantSchema();

  const result = await query(
    `INSERT INTO company_access_requests
      (company_name, city, contact_name, contact_email, phone, employee_count, admin_password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${requestSelect}`,
    [
      data.companyName.trim(),
      data.city.trim(),
      data.contactName.trim(),
      normalizeEmail(data.contactEmail),
      normalizePhone(data.phone) || null,
      normalizeEmployeeCount(data.employeeCount),
      data.adminPasswordHash
    ]
  );
  return result.rows[0];
}

export async function findCompanyAccessConflict(data) {
  await ensureTenantSchema();

  const contactEmail = normalizeEmail(data.contactEmail);
  const companyName = data.companyName.trim();
  const [user, employee, activeEmailRequest, company, activeCompanyRequest] = await Promise.all([
    query("SELECT id FROM app_users WHERE lower(email) = lower($1) LIMIT 1", [contactEmail]),
    query("SELECT id FROM employees WHERE lower(email) = lower($1) LIMIT 1", [contactEmail]),
    query(
      `SELECT id, status FROM company_access_requests
       WHERE lower(contact_email) = lower($1)
         AND status IN ('Pending', 'Approved')
       LIMIT 1`,
      [contactEmail]
    ),
    query("SELECT id FROM companies WHERE lower(name) = lower($1) LIMIT 1", [companyName]),
    query(
      `SELECT id, status FROM company_access_requests
       WHERE lower(company_name) = lower($1)
         AND status IN ('Pending', 'Approved')
       LIMIT 1`,
      [companyName]
    )
  ]);

  if (user.rows[0]) return "Email này đã thuộc một tài khoản BIZEN.";
  if (employee.rows[0]) return "Email này đã thuộc hồ sơ nhân viên trong BIZEN.";
  if (activeEmailRequest.rows[0]) return "Email này đã có yêu cầu doanh nghiệp đang chờ duyệt hoặc đã được duyệt.";
  if (company.rows[0]) return "Tên doanh nghiệp này đã tồn tại trên BIZEN.";
  if (activeCompanyRequest.rows[0]) return "Tên doanh nghiệp này đã có yêu cầu đang chờ duyệt hoặc đã được duyệt.";
  return null;
}

export async function listCompanyAccessRequests(status = "Pending") {
  await ensureTenantSchema();

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
    await ensureTenantSchema(client);

    const current = await client.query(
      `SELECT *
       FROM company_access_requests
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );
    const request = current.rows[0];
    if (!request) return null;
    if (request.status !== "Pending") {
      throw httpError(409, `Yêu cầu doanh nghiệp này đã ở trạng thái ${request.status}`);
    }

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

    const email = normalizeEmail(request.contact_email);
    const existingUser = await client.query("SELECT id FROM app_users WHERE lower(email) = lower($1) LIMIT 1", [email]);
    const existingEmployee = await client.query("SELECT id FROM employees WHERE lower(email) = lower($1) LIMIT 1", [email]);
    const existingCompany = await client.query("SELECT id FROM companies WHERE lower(name) = lower($1) LIMIT 1", [request.company_name.trim()]);
    if (existingUser.rows[0] || existingEmployee.rows[0]) {
      throw httpError(409, "Email đại diện đã được dùng trong hệ thống, không thể duyệt doanh nghiệp này.");
    }
    if (existingCompany.rows[0]) {
      throw httpError(409, "Tên doanh nghiệp đã tồn tại, không thể duyệt trùng tenant.");
    }

    const company = await client.query(
      `INSERT INTO companies (name, city)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      [request.company_name.trim(), request.city.trim()]
    );
    if (!company.rows[0]) {
      throw httpError(409, "Tên doanh nghiệp đã tồn tại, không thể tạo tenant trùng.");
    }
    const companyId = company.rows[0].id;
    await createCompanyDefaults(client, companyId, request.employee_count);

    const admin = await client.query(
      `INSERT INTO app_users
        (company_id, employee_id, google_sub, email, name, picture_url, password_hash, role, status, last_login_at)
       VALUES ($1, NULL, $2, $3, $4, NULL, $5, 'Admin', 'Approved', now())
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [companyId, `company-admin:${email}`, email, request.contact_name.trim(), request.admin_password_hash]
    );
    if (!admin.rows[0]) {
      throw httpError(409, "Email đại diện đã được dùng, không thể tạo tài khoản chủ sở hữu.");
    }

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
