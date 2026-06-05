import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { query } from "../../config/db.js";
import { env } from "../../config/env.js";
import { httpError } from "../../shared/httpError.js";
import { isStrongPassword, normalizeEmail } from "../../shared/validation.js";
import {
  createPasswordResetToken,
  findEmployeeByEmail,
  getUserByEmail,
  getUserById,
  listAccountRequests,
  reviewAccountRequest,
  resetPasswordWithToken,
  touchUserLogin,
  upsertGoogleUser
} from "./auth.repository.js";
import { getPlatformAdminUser, isPlatformAdminCredentials, isPlatformAdminTokenPayload } from "./platformAdmin.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { buildEmployeeApprovedEmail, buildPasswordResetEmail, sendMail } from "../mail/mail.service.js";

const googleLoginSchema = z.object({
  credential: z.string().min(20)
});

const passwordLoginSchema = z.object({
  email: z.string().trim().email().transform(normalizeEmail),
  password: z.string().min(6)
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().transform(normalizeEmail)
});

const passwordResetConfirmSchema = z.object({
  token: z.string().min(30),
  password: z.string().refine(isStrongPassword, "Password must have at least 8 characters, one letter and one number")
});

const accountRequestStatusSchema = z.object({
  status: z.enum(["Approved", "Rejected", "Suspended"])
});

const client = new OAuth2Client();

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      employeeId: user.employeeId || null,
      companyId: user.companyId || null,
      email: user.email,
      name: user.name,
      status: user.status
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

function assertSupportedTenantRole(user) {
  if (user.role && !["Admin", "Employee"].includes(user.role)) {
    throw httpError(403, "BIZEN MVP hiện chỉ hỗ trợ quyền Chủ sở hữu hoặc Nhân viên. Chủ sở hữu cần chuyển tài khoản này về quyền phù hợp.");
  }
}

async function getCompanyName(companyId) {
  if (!companyId) return "doanh nghiệp";
  const result = await query("SELECT name FROM companies WHERE id = $1 LIMIT 1", [companyId]);
  return result.rows[0]?.name || "doanh nghiệp";
}

function isAllowedReturnOrigin(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const origin = url.origin;
    const hostname = url.hostname;
    const isLocal =
      env.nodeEnv !== "production" &&
      (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname));

    return env.clientOrigins.includes(origin) || isLocal;
  } catch {
    return false;
  }
}

function encodeJsonForHash(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function getDefaultRedirectPath(user, experience = "web") {
  if (user.role === "Employee") return experience === "mobile" ? "/mobile/home" : "/web/me";
  if (user.role === "Admin") return "/web/home";
  if (user.role === "PlatformAdmin") return "/platform/companies";
  return "/login";
}

function getRequestOrigin(req) {
  const host = req.headers.host;
  if (!host) return env.clientOrigin;
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "https";
  return `${protocol}://${host}`;
}

async function completeGoogleLogin(credential) {
  if (!env.googleClientId || env.googleClientId.includes("your-google")) {
    throw httpError(500, "GOOGLE_CLIENT_ID is not configured on the backend deployment");
  }

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    throw httpError(401, "Invalid Google account payload");
  }

  const googleEmail = normalizeEmail(payload.email);
  const existingUser = await getUserByEmail(googleEmail);
  const employee = await findEmployeeByEmail(googleEmail);

  if (existingUser) assertSupportedTenantRole(existingUser);
  if (employee) assertSupportedTenantRole(employee);

  if (!existingUser) {
    if (employee) {
      throw httpError(403, "Chủ/quản lý cần cấp tài khoản đăng nhập cho email nhân viên này trước.");
    }

    throw httpError(403, "This email is not attached to an approved BIZEN account");
  }

  if (existingUser.status !== "Approved") {
    throw httpError(403, `Account status is ${existingUser.status}. It must be approved before login`);
  }

  const user = await upsertGoogleUser(
    existingUser.companyId || employee?.companyId,
    {
      sub: payload.sub,
      email: googleEmail,
      name: payload.name || googleEmail,
      picture: payload.picture || null
    },
    employee,
    existingUser
  );
  assertSupportedTenantRole(user);

  return {
    token: signToken(user),
    user
  };
}

export async function googleLoginHandler(req, res) {
  const { credential } = googleLoginSchema.parse(req.body);
  res.json(await completeGoogleLogin(credential));
}

export async function googleRedirectLoginHandler(req, res) {
  const { credential } = googleLoginSchema.parse(req.body);
  const experience = req.query.experience === "mobile" ? "mobile" : "web";
  const returnOrigin = isAllowedReturnOrigin(req.query.returnOrigin) ? new URL(req.query.returnOrigin).origin : getRequestOrigin(req);
  const session = await completeGoogleLogin(credential);
  const callbackUrl = new URL("/auth/google/callback", returnOrigin);
  callbackUrl.hash = new URLSearchParams({
    token: session.token,
    user: encodeJsonForHash(session.user),
    experience,
    next: getDefaultRedirectPath(session.user, experience)
  }).toString();

  res.redirect(303, callbackUrl.toString());
}

export async function passwordLoginHandler(req, res) {
  const data = passwordLoginSchema.parse(req.body);
  const email = data.email;

  if (isPlatformAdminCredentials(email, data.password)) {
    const user = getPlatformAdminUser();
    res.json({
      token: signToken(user),
      user
    });
    return;
  }

  const userWithPassword = await getUserByEmail(email, { includePassword: true });
  if (!userWithPassword) {
    throw httpError(401, "Invalid email or password");
  }

  if (userWithPassword.status !== "Approved") {
    throw httpError(403, `Account status is ${userWithPassword.status}. The owner must approve it first`);
  }
  assertSupportedTenantRole(userWithPassword);

  const hasAccountPassword = verifyPassword(data.password, userWithPassword.passwordHash);
  const hasLegacyPassword = !userWithPassword.passwordHash && data.password === env.passwordLoginSecret;
  if (!hasAccountPassword && !hasLegacyPassword) {
    throw httpError(401, "Invalid email or password");
  }

  const user = await touchUserLogin(userWithPassword.id);
  assertSupportedTenantRole(user);

  res.json({
    token: signToken(user),
    user
  });
}

export async function requestPasswordResetHandler(req, res) {
  const data = passwordResetRequestSchema.parse(req.body);
  const user = await getUserByEmail(data.email);

  if (user?.status === "Approved") {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = new URL("/reset-password", `${getRequestOrigin(req)}/`);
    resetUrl.searchParams.set("token", token);
    await sendMail({
      to: user.email,
      ...buildPasswordResetEmail({
        userName: user.name,
        resetUrl: resetUrl.toString()
      })
    });
  }

  res.json({
    ok: true,
    message: "Nếu email tồn tại và đã được duyệt, BIZEN sẽ gửi link đặt lại mật khẩu."
  });
}

export async function confirmPasswordResetHandler(req, res) {
  const data = passwordResetConfirmSchema.parse(req.body);
  const user = await resetPasswordWithToken(data.token, hashPassword(data.password));
  if (!user) {
    throw httpError(400, "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
  }

  res.json({
    ok: true,
    message: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.",
    user
  });
}

export async function listAccountRequestsHandler(req, res) {
  if (!req.user?.companyId) throw httpError(403, "Company account required");
  const status = req.query.status || "Pending";
  res.json(await listAccountRequests(req.user.companyId, status));
}

export async function reviewAccountRequestHandler(req, res) {
  if (!req.user?.companyId) throw httpError(403, "Company account required");
  if (req.params.id === req.user.id && req.body.status !== "Approved") {
    throw httpError(400, "You cannot disable your own account");
  }

  const data = accountRequestStatusSchema.parse(req.body);
  const targetUser = await getUserById(req.params.id);
  if (targetUser && targetUser.companyId === req.user.companyId && req.user.role !== "Admin" && targetUser.role === "Admin") {
    throw httpError(403, "Chỉ chủ sở hữu được duyệt hoặc khóa tài khoản chủ sở hữu");
  }

  const user = await reviewAccountRequest(req.user.companyId, req.params.id, data.status);
  if (!user) throw httpError(404, "Account request not found");
  if (user.status === "Approved") {
    await sendMail({
      to: user.email,
      ...buildEmployeeApprovedEmail({
        employeeName: user.name,
        companyName: await getCompanyName(user.companyId)
      })
    });
  }

  res.json(user);
}

export async function meHandler(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw httpError(401, "Missing bearer token");

  const decoded = jwt.verify(token, env.jwtSecret);
  if (isPlatformAdminTokenPayload(decoded)) {
    res.json(getPlatformAdminUser());
    return;
  }

  const user = await getUserById(decoded.sub);
  if (!user) throw httpError(401, "User not found");
  if (user.status !== "Approved") throw httpError(403, "Account is not approved");
  assertSupportedTenantRole(user);
  res.json(user);
}
