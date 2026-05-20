import { query } from "../../config/db.js";

const employeeSelect = `
  SELECT
    e.id,
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
  LEFT JOIN departments d ON d.id = e.department_id
`;

export async function listEmployees() {
  const result = await query(`${employeeSelect} ORDER BY e.id`);
  return result.rows;
}

export async function getEmployeeById(id) {
  const result = await query(`${employeeSelect} WHERE e.id = $1`, [id]);
  return result.rows[0];
}

export async function createEmployee(companyId, data) {
  const next = await query("SELECT COUNT(*)::int + 1 AS next FROM employees");
  const id = `BZN${String(next.rows[0].next).padStart(3, "0")}`;
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
      data.manager || "Đỗ Thanh Tâm",
      data.shiftId || "morning",
      data.leaveRemaining || 12,
      data.address || "Đà Nẵng"
    ]
  );
  return getEmployeeById(id);
}

export async function updateEmployee(id, data) {
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
     WHERE id = $1`,
    [id, data.name, data.departmentId, data.position, data.role, data.contractType, data.baseSalary, data.status, data.email, data.phone]
  );
  return getEmployeeById(id);
}

export async function deleteEmployee(id) {
  await query("DELETE FROM employees WHERE id = $1", [id]);
}
