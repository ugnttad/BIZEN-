import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { env } from "../../config/env.js";
import { httpError } from "../../shared/httpError.js";
import {
  createEmployeeAccountRequest,
  findEmployeeByEmail,
  getUserByEmail,
  getUserById,
  listAccountRequests,
  reviewAccountRequest,
  touchUserLogin,
  upsertGoogleUser
} from "./auth.repository.js";
import { getPlatformAdminUser, isPlatformAdminCredentials, isPlatformAdminTokenPayload } from "./platformAdmin.js";
import { hashPassword, verifyPassword } from "./password.service.js";

const googleLoginSchema = z.object({
  credential: z.string().min(20)
});

const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const employeeAccountRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must have at least 8 characters")
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

export async function googleLoginHandler(req, res) {
  if (!env.googleClientId || env.googleClientId.includes("your-google")) {
    throw httpError(500, "GOOGLE_CLIENT_ID is not configured on the backend deployment");
  }

  const { credential } = googleLoginSchema.parse(req.body);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    throw httpError(401, "Invalid Google account payload");
  }

  const existingUser = await getUserByEmail(payload.email);
  const employee = await findEmployeeByEmail(payload.email);

  if (!existingUser) {
    if (employee) {
      await createEmployeeAccountRequest(employee);
      throw httpError(403, "Employee account request was sent to company HR for approval");
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
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || null
    },
    employee,
    existingUser
  );

  res.json({
    token: signToken(user),
    user
  });
}

export async function passwordLoginHandler(req, res) {
  const data = passwordLoginSchema.parse(req.body);
  const email = data.email.trim().toLowerCase();

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
    throw httpError(403, `Account status is ${userWithPassword.status}. Company admin or HR must approve it first`);
  }

  const hasAccountPassword = verifyPassword(data.password, userWithPassword.passwordHash);
  const hasLegacyPassword = !userWithPassword.passwordHash && data.password === env.passwordLoginSecret;
  if (!hasAccountPassword && !hasLegacyPassword) {
    throw httpError(401, "Invalid email or password");
  }

  const user = await touchUserLogin(userWithPassword.id);

  res.json({
    token: signToken(user),
    user
  });
}

export async function requestEmployeeAccountHandler(req, res) {
  const data = employeeAccountRequestSchema.parse(req.body);
  const employee = await findEmployeeByEmail(data.email);

  if (!employee) {
    throw httpError(404, "HR must create this employee profile before an account can be requested");
  }

  const user = await createEmployeeAccountRequest(employee, hashPassword(data.password));
  res.status(user.status === "Approved" ? 200 : 201).json(user);
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
  const user = await reviewAccountRequest(req.user.companyId, req.params.id, data.status);
  if (!user) throw httpError(404, "Account request not found");

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
  res.json(user);
}
