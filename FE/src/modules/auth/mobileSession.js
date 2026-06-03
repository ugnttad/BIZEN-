import { clearAuthSession, getAuthUser } from "./authStore";

const MOBILE_EMPLOYEE_KEY = "bizen_mobile_employee";

export function saveMobileEmployee(employee) {
  localStorage.setItem(
    MOBILE_EMPLOYEE_KEY,
    JSON.stringify({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      avatarUrl: employee.avatarUrl
    })
  );
}

export function getMobileEmployeeSession() {
  const authUser = getAuthUser();
  if (authUser?.employeeId) {
    return {
      id: authUser.employeeId,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      avatarUrl: authUser.pictureUrl
    };
  }

  const raw = localStorage.getItem(MOBILE_EMPLOYEE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getMobileEmployeeId() {
  return getMobileEmployeeSession()?.id || null;
}

export function clearMobileEmployeeSession() {
  localStorage.removeItem(MOBILE_EMPLOYEE_KEY);
  clearAuthSession();
}

export function getFirstName(name = "") {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || "bạn";
}
