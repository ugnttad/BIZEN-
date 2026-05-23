import { env } from "../../config/env.js";

export const PLATFORM_ADMIN_ID = "platform-admin";

export function getPlatformAdminUser() {
  return {
    id: PLATFORM_ADMIN_ID,
    companyId: null,
    employeeId: null,
    email: env.platformAdminEmail,
    name: "BIZEN Platform Admin",
    pictureUrl: null,
    role: "PlatformAdmin",
    status: "Approved",
    lastLoginAt: new Date().toISOString()
  };
}

export function isPlatformAdminCredentials(email, password) {
  return email.toLowerCase() === env.platformAdminEmail.toLowerCase() && password === env.platformAdminPassword;
}

export function isPlatformAdminTokenPayload(payload) {
  return payload?.sub === PLATFORM_ADMIN_ID && payload?.role === "PlatformAdmin";
}
