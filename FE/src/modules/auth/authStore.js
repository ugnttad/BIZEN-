const TOKEN_KEY = "bizen_auth_token";
const USER_KEY = "bizen_auth_user";
const EMPLOYEE_EXPERIENCE_KEY = "bizen_employee_experience";

export function saveAuthSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getAuthUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setEmployeeExperiencePreference(value) {
  if (["web", "mobile"].includes(value)) {
    localStorage.setItem(EMPLOYEE_EXPERIENCE_KEY, value);
  }
}

export function getEmployeeExperiencePreference() {
  return localStorage.getItem(EMPLOYEE_EXPERIENCE_KEY);
}

export function prefersMobileExperience() {
  if (typeof window === "undefined") return false;
  if (!window.matchMedia) return window.innerWidth < 768;
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

export function getDefaultPathForRole(role) {
  if (role === "PlatformAdmin") return "/platform/companies";
  if (role === "Employee") {
    const preference = getEmployeeExperiencePreference();
    if (preference === "web") return "/web/me";
    if (preference === "mobile") return "/mobile/home";
    return prefersMobileExperience() ? "/mobile/home" : "/web/me";
  }
  if (role === "Admin") return "/web/home";
  return "/login";
}
