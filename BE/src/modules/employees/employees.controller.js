import { z } from "zod";
import { httpError } from "../../shared/httpError.js";
import { getDefaultCompanyId } from "../companies/company.repository.js";
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

export async function listEmployeesHandler(_req, res) {
  res.json(await listEmployees());
}

export async function getEmployeeHandler(req, res) {
  const employee = await getEmployeeById(req.params.id);
  if (!employee) throw httpError(404, "Employee not found");
  res.json(employee);
}

export async function createEmployeeHandler(req, res) {
  const data = employeeSchema.parse(req.body);
  const companyId = await getDefaultCompanyId();
  res.status(201).json(await createEmployee(companyId, data));
}

export async function updateEmployeeHandler(req, res) {
  const data = employeeSchema.partial().parse(req.body);
  const employee = await updateEmployee(req.params.id, data);
  if (!employee) throw httpError(404, "Employee not found");
  res.json(employee);
}

export async function deleteEmployeeHandler(req, res) {
  await deleteEmployee(req.params.id);
  res.status(204).end();
}
