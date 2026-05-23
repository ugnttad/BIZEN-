import { z } from "zod";
import { httpError } from "../../shared/httpError.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
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
  address: z.string().optional()
});

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
  try {
    res.status(201).json(await createEmployee(companyId, data));
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
  const employee = await updateEmployee(req.params.id, companyId, data);
  if (!employee) throw httpError(404, "Employee not found");
  res.json(employee);
}

export async function deleteEmployeeHandler(req, res) {
  const companyId = await getCompanyIdForUser(req.user);
  await deleteEmployee(req.params.id, companyId);
  res.status(204).end();
}
