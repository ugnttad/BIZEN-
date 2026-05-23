import { query } from "../../config/db.js";

const employeeSelect = `
  SELECT
    e.id,
    e.company_id AS "companyId",
    e.name,
    d.name AS department,
    e.department_id AS "departmentId",
    e.position,
    e.role,
    e.contract_type AS "contractType",
    e.base_salary::int AS "baseSalary",
    e.status,
    e.email,
    e.phone,
    to_char(e.start_date, 'YYYY-MM-DD') AS "startDate",
    e.manager_name AS manager,
    e.shift_id AS "shiftId",
    e.leave_remaining::float AS "leaveRemaining",
    e.address
  FROM employees e
  LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
`;

export async function listEmployees(companyId) {
  const result = await query(`${employeeSelect} WHERE e.company_id = $1 ORDER BY e.id`, [companyId]);
  return result.rows;
}

export async function getEmployeeById(id, companyId) {
  const result = await query(`${employeeSelect} WHERE e.id = $1 AND e.company_id = $2`, [id, companyId]);
  return result.rows[0];
}

async function nextEmployeeId(companyId) {
  const prefix = companyId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const existing = await query(`SELECT id FROM employees WHERE company_id = $1 AND id LIKE $2`, [companyId, `${prefix}-NV%`]);

  let maxSeq = 0;
  for (const row of existing.rows) {
    const match = row.id.match(/-NV(\d+)$/);
    if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
  }

  for (let attempt = 1; attempt <= 1000; attempt += 1) {
    const id = `${prefix}-NV${String(maxSeq + attempt).padStart(3, "0")}`;
    const taken = await query("SELECT 1 FROM employees WHERE id = $1 LIMIT 1", [id]);
    if (!taken.rows.length) return id;
  }

  throw new Error("Không tạo được mã nhân viên mới");
}

export async function createEmployee(companyId, data) {
  const id = await nextEmployeeId(companyId);
  const shift = data.shiftId
    ? { id: data.shiftId }
    : (await query("SELECT id FROM shifts WHERE company_id = $1 ORDER BY short_time LIMIT 1", [companyId])).rows[0];

  await query(
    `INSERT INTO employees
      (id, company_id, name, department_id, position, role, contract_type, base_salary, status, email, phone, start_date, manager_name, shift_id, leave_remaining, address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE, $12, $13, $14, $15)`,
    [
      id,
      companyId,
      data.name,
      data.departmentId,
      data.position,
      data.role,
      data.contractType,
      data.baseSalary,
      data.status,
      data.email,
      data.phone,
      data.manager || "Quản lý",
      shift?.id || null,
      data.leaveRemaining || 12,
      data.address || "Đà Nẵng"
    ]
  );
  return getEmployeeById(id, companyId);
}

export async function updateEmployee(id, companyId, data) {
  await query(
    `UPDATE employees SET
      name = COALESCE($2, name),
      department_id = COALESCE($3, department_id),
      position = COALESCE($4, position),
      role = COALESCE($5, role),
      contract_type = COALESCE($6, contract_type),
      base_salary = COALESCE($7, base_salary),
      status = COALESCE($8, status),
      email = COALESCE($9, email),
      phone = COALESCE($10, phone),
      updated_at = now()
     WHERE id = $1 AND company_id = $11`,
    [id, data.name, data.departmentId, data.position, data.role, data.contractType, data.baseSalary, data.status, data.email, data.phone, companyId]
  );
  return getEmployeeById(id, companyId);
}

export async function deleteEmployee(id, companyId) {
  await query("DELETE FROM employees WHERE id = $1 AND company_id = $2", [id, companyId]);
}
