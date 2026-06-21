import { z } from "zod";
import { query } from "../../config/db.js";
import { httpError } from "../../shared/httpError.js";
import { normalizeEmail } from "../../shared/validation.js";
import { getCompanyById, getCompanyIdForUser } from "../companies/company.repository.js";
import { updateEmployeeAccountProfile, upsertPasswordUser } from "../auth/auth.repository.js";
import { hashPassword } from "../auth/password.service.js";
import { buildEmployeeCreatedEmail, sendMail } from "../mail/mail.service.js";
import { createEmployee, deleteEmployee, getEmployeeById, listEmployees, updateEmployee } from "./employees.repository.js";
import { getPositionOptions, ownerPositions } from "./positionCatalog.js";

const employeeSchema = z.object({
  name: z.string().min(2),
  departmentId: z.string().min(1),
  position: z.string().min(2),
  role: z.enum(["Admin", "Employee"]).default("Employee"),
  contractType: z.string().min(2),
  payType: z.enum(["Monthly", "Hourly"]).optional(),
  baseSalary: z.coerce.number().nonnegative().optional(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
  status: z.enum(["Active", "On leave", "Inactive"]).default("Active"),
  email: z.string().email(),
  phone: z.string().optional(),
  manager: z.string().optional(),
  shiftId: z.string().optional(),
  leaveRemaining: z.coerce.number().optional(),
  address: z.string().optional(),
  accountPassword: z.string().optional()
});

const cafeShopConstraints = {
  maxActiveEmployees: 20,
  maxOwners: 1,
  minBaseSalary: 1000000,
  maxBaseSalary: 30000000,
  minHourlyRate: 10000,
  maxHourlyRate: 500000,
  passwordPattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
  phonePattern: /^0?\d{9,10}$/
};

const allowedAccessRoles = ["Admin", "Employee"];

function stripVietnamese(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function normalizeEmployeePayload(data) {
  if (data.name) data.name = data.name.trim();
  if (data.email) data.email = normalizeEmail(data.email);
  if (data.phone) data.phone = normalizePhone(data.phone);
  if (data.payType || data.contractType) {
    data.payType = normalizePayType(data.payType || inferPayTypeFromContract(data.contractType));
  }
  if (data.baseSalary !== undefined) data.baseSalary = Number(data.baseSalary);
  if (data.hourlyRate !== undefined) data.hourlyRate = Number(data.hourlyRate);
  return data;
}

function normalizePayType(value) {
  return value === "Hourly" ? "Hourly" : "Monthly";
}

function inferPayTypeFromContract(contractType = "") {
  const normalized = stripVietnamese(contractType).toLowerCase();
  if (normalized.includes("part") || normalized.includes("ban thoi gian") || normalized.includes("thoi vu")) {
    return "Hourly";
  }
  return "Monthly";
}

function isOperational(employee) {
  return employee.status !== "Inactive";
}

async function getDepartmentName(companyId, departmentId) {
  if (!departmentId) return null;
  const result = await query("SELECT name FROM departments WHERE id = $1 AND company_id = $2", [departmentId, companyId]);
  if (!result.rows[0]) throw httpError(400, "Bộ phận làm việc không hợp lệ");
  return result.rows[0].name;
}

async function getCompanyName(companyId) {
  const result = await query("SELECT name FROM companies WHERE id = $1 LIMIT 1", [companyId]);
  return result.rows[0]?.name || "doanh nghiệp";
}

async function cleanupReusableOrphanEmployeeAccount(email) {
  await query(
    `DELETE FROM app_users
     WHERE lower(email) = lower($1)
       AND role = 'Employee'
       AND employee_id IS NULL`,
    [email]
  );
}

async function assertEmailAvailable(email, currentEmployeeId = null) {
  await cleanupReusableOrphanEmployeeAccount(email);

  const [employee, user, companyRequest] = await Promise.all([
    query(
      `SELECT id FROM employees
       WHERE lower(email) = lower($1)
         AND ($2::text IS NULL OR id <> $2)
       LIMIT 1`,
      [email, currentEmployeeId]
    ),
    query(
      `SELECT id, employee_id AS "employeeId", role FROM app_users
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [email]
    ),
    query(
      `SELECT id FROM company_access_requests
       WHERE lower(contact_email) = lower($1)
         AND status IN ('Pending', 'Approved')
       LIMIT 1`,
      [email]
    )
  ]);

  if (employee.rows[0]) {
    throw httpError(409, "Email này đã được dùng cho hồ sơ nhân viên khác");
  }
  const existingUser = user.rows[0];
  if (existingUser && (!currentEmployeeId || existingUser.employeeId !== currentEmployeeId)) {
    throw httpError(409, "Email này đã thuộc một tài khoản đăng nhập khác");
  }
  if (companyRequest.rows[0]) {
    throw httpError(409, "Email này đang được dùng cho yêu cầu đăng ký doanh nghiệp");
  }
}

async function assertCafeShopConstraints(companyId, data, current = null) {
  const departmentName = data.departmentId ? await getDepartmentName(companyId, data.departmentId) : current?.department;
  const company = await getCompanyById(companyId);
  const businessType = company?.businessType || "";
  const nextEmployee = {
    id: current?.id,
    status: data.status ?? current?.status ?? "Active",
    role: data.role ?? current?.role ?? "Employee",
    position: data.position ?? current?.position,
    contractType: data.contractType ?? current?.contractType ?? "",
    payType: normalizePayType(data.payType ?? current?.payType ?? inferPayTypeFromContract(data.contractType ?? current?.contractType)),
    baseSalary: Number(data.baseSalary ?? current?.baseSalary ?? 0),
    hourlyRate: Number(data.hourlyRate ?? current?.hourlyRate ?? 0),
    phone: data.phone ?? current?.phone ?? "",
    department: departmentName
  };

  if (!allowedAccessRoles.includes(nextEmployee.role)) {
    throw httpError(400, "MVP BIZEN chỉ dùng 2 quyền truy cập: Chủ sở hữu và Nhân viên");
  }

  if (!departmentName) {
    throw httpError(400, "Chọn bộ phận làm việc hợp lệ");
  }

  const employees = await listEmployees(companyId);
  const nextOperationalEmployees = [
    ...employees.filter((employee) => employee.id !== current?.id && isOperational(employee)),
    ...(isOperational(nextEmployee) ? [nextEmployee] : [])
  ];

  if (nextOperationalEmployees.length > cafeShopConstraints.maxActiveEmployees) {
    throw httpError(400, `BIZEN MVP giới hạn tối đa ${cafeShopConstraints.maxActiveEmployees} nhân sự đang làm cho một doanh nghiệp`);
  }

  if (nextOperationalEmployees.filter((employee) => employee.role === "Admin").length > cafeShopConstraints.maxOwners) {
    throw httpError(400, "Mỗi doanh nghiệp chỉ nên có tối đa 1 hồ sơ chủ sở hữu");
  }

  if (nextEmployee.role === "Employee" && ownerPositions.includes(nextEmployee.position)) {
    throw httpError(400, "Nhân viên không được chọn chức vụ Chủ sở hữu");
  }

  if (!getPositionOptions(departmentName, nextEmployee.role, businessType).includes(nextEmployee.position)) {
    throw httpError(400, "Chức vụ công việc phải phù hợp với loại hình doanh nghiệp và bộ phận làm việc");
  }

  if (nextEmployee.payType === "Monthly" && (nextEmployee.baseSalary < cafeShopConstraints.minBaseSalary || nextEmployee.baseSalary > cafeShopConstraints.maxBaseSalary)) {
    throw httpError(400, "Lương cơ bản cần nằm trong khoảng 1.000.000 - 30.000.000 VNĐ/tháng");
  }

  if (nextEmployee.payType === "Hourly" && (nextEmployee.hourlyRate < cafeShopConstraints.minHourlyRate || nextEmployee.hourlyRate > cafeShopConstraints.maxHourlyRate)) {
    throw httpError(400, "Lương theo giờ cần nằm trong khoảng 10.000 - 500.000 VNĐ/giờ");
  }

  const phoneDigits = normalizePhone(nextEmployee.phone);
  if (phoneDigits && !cafeShopConstraints.phonePattern.test(phoneDigits)) {
    throw httpError(400, "Số điện thoại cần 9-11 chữ số, phù hợp số điện thoại Việt Nam");
  }

  if (data.accountPassword && !cafeShopConstraints.passwordPattern.test(data.accountPassword)) {
    throw httpError(400, "Mật khẩu cần ít nhất 8 ký tự, có chữ và số");
  }
}

function assertCanAssignRole(user, role) {
  if (user.role !== "Admin" && role === "Admin") {
    throw httpError(403, "Chỉ chủ sở hữu được cấp quyền chủ sở hữu");
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
  const data = normalizeEmployeePayload(employeeSchema.parse(req.body));
  data.payType = normalizePayType(data.payType || inferPayTypeFromContract(data.contractType));
  data.baseSalary = Number(data.baseSalary ?? 0);
  data.hourlyRate = Number(data.hourlyRate ?? 0);
  const companyId = await getCompanyIdForUser(req.user);
  assertCanAssignRole(req.user, data.role);
  if (!data.accountPassword) {
    throw httpError(400, "Cần cấp mật khẩu đăng nhập để nhân viên dùng web/mobile ngay");
  }
  await assertEmailAvailable(data.email);
  await assertCafeShopConstraints(companyId, data);

  try {
    const employee = await createEmployee(companyId, data);
    if (data.accountPassword) {
      await upsertPasswordUser(companyId, employee, hashPassword(data.accountPassword), "Approved");
      await sendMail({
        to: employee.email,
        ...buildEmployeeCreatedEmail({
          employeeName: employee.name,
          companyName: await getCompanyName(companyId)
        })
      });
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
  const data = normalizeEmployeePayload(employeeSchema.partial().parse(req.body));
  const companyId = await getCompanyIdForUser(req.user);
  const current = await getEmployeeById(req.params.id, companyId);
  if (!current) throw httpError(404, "Employee not found");

  assertCanAssignRole(req.user, data.role || current.role);
  if (req.user.role !== "Admin" && current.role === "Admin") {
    throw httpError(403, "Chỉ chủ sở hữu được sửa tài khoản chủ sở hữu");
  }
  if (data.email) await assertEmailAvailable(data.email, current.id);
  await assertCafeShopConstraints(companyId, data, current);

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
    throw httpError(403, "Chỉ chủ sở hữu được xóa tài khoản chủ sở hữu");
  }
  await deleteEmployee(req.params.id, companyId);
  res.status(204).end();
}
