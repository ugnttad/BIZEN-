import { z } from "zod";
import { httpError } from "../../shared/httpError.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { updateEmployeeAccountProfile, upsertPasswordUser } from "../auth/auth.repository.js";
import { hashPassword } from "../auth/password.service.js";
import { createEmployee, deleteEmployee, getEmployeeById, listEmployees, updateEmployee } from "./employees.repository.js";

const employeeSchema = z.object({
  name: z.string().min(2),
  departmentId: z.string().min(1),
  position: z.string().min(2),
  role: z.enum(["Admin", "HR", "Manager", "Employee"]).default("Employee"),
  contractType: z.string().min(2),
  baseSalary: z.coerce.number().nonnegative(),
  status: z.enum(["Active", "On leave", "Inactive"]).default("Active"),
  email: z.string().email(),
  phone: z.string().optional(),
  manager: z.string().optional(),
  shiftId: z.string().optional(),
  leaveRemaining: z.coerce.number().optional(),
  address: z.string().optional(),
  accountPassword: z.string().min(8, "Password must have at least 8 characters").optional()
});

function assertCanAssignRole(user, role) {
  if (user.role !== "Admin" && ["Admin", "HR"].includes(role)) {
    throw httpError(403, "Chỉ Admin doanh nghiệp được cấp quyền Admin hoặc Nhân sự");
  }
}

export async function listEmployeesHandler(req, res) {
  if (req.user.role === "Employee") {
    const companyId = await getCompanyIdForUser(req.user);
    res.json([await getEmployeeById(req.user.employeeId, companyId)].filter(Boolean));
    return;
  }

  const companyId = await getCompanyIdForUser(req.user);
  res.json(await listEmployees(companyId));
}

export async function getEmployeeHandler(req, res) {
  if (req.user.role === "Employee" && req.params.id !== req.user.employeeId) {
    throw httpError(403, "Employees can only access their own profile");
  }

  const companyId = await getCompanyIdForUser(req.user);
  const employee = await getEmployeeById(req.params.id, companyId);
  if (!employee) throw httpError(404, "Employee not found");
  res.json(employee);
}

export async function createEmployeeHandler(req, res) {
  const data = employeeSchema.parse(req.body);
  const companyId = await getCompanyIdForUser(req.user);
  assertCanAssignRole(req.user, data.role);

  try {
    const employee = await createEmployee(companyId, data);
    if (data.accountPassword) {
      await upsertPasswordUser(companyId, employee, hashPassword(data.accountPassword), "Approved");
    }
    res.status(201).json(employee);
  } catch (error) {
    if (error.code === "23505") {
      if (error.constraint === "employees_email_key") {
        throw httpError(409, "Email này đã được dùng cho nhân viên khác");
      }
      throw httpError(409, "Mã nhân viên hoặc dữ liệu bị trùng. Vui lòng thử lại");
    }
    throw error;
  }
}

export async function updateEmployeeHandler(req, res) {
  const data = employeeSchema.partial().parse(req.body);
  const companyId = await getCompanyIdForUser(req.user);
  const current = await getEmployeeById(req.params.id, companyId);
  if (!current) throw httpError(404, "Employee not found");

  assertCanAssignRole(req.user, data.role || current.role);
  if (req.user.role !== "Admin" && current.role === "Admin") {
    throw httpError(403, "Chỉ Admin doanh nghiệp được sửa tài khoản Admin");
  }

  const employee = await updateEmployee(req.params.id, companyId, data);
  if (!employee) throw httpError(404, "Employee not found");

  if (data.accountPassword) {
    await upsertPasswordUser(companyId, employee, hashPassword(data.accountPassword), "Approved");
  } else {
    await updateEmployeeAccountProfile(companyId, employee);
  }

  res.json(employee);
}

export async function deleteEmployeeHandler(req, res) {
  const companyId = await getCompanyIdForUser(req.user);
  const employee = await getEmployeeById(req.params.id, companyId);
  if (req.user.role !== "Admin" && employee?.role === "Admin") {
    throw httpError(403, "Chỉ Admin doanh nghiệp được xóa tài khoản Admin");
  }
  await deleteEmployee(req.params.id, companyId);
  res.status(204).end();
}
