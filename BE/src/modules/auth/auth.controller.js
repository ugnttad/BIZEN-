import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { env } from "../../config/env.js";
import { httpError } from "../../shared/httpError.js";
import { getDefaultCompanyId } from "../companies/company.repository.js";
import { findEmployeeByEmail, getUserById, upsertGoogleUser } from "./auth.repository.js";

const googleLoginSchema = z.object({
  credential: z.string().min(20)
});

const client = new OAuth2Client();

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      employeeId: user.employeeId || null
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

export async function googleLoginHandler(req, res) {
  if (!env.googleClientId || env.googleClientId.includes("your-google")) {
    throw httpError(500, "GOOGLE_CLIENT_ID is not configured in BE/.env");
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

  const companyId = await getDefaultCompanyId();
  const employee = await findEmployeeByEmail(payload.email);
  const user = await upsertGoogleUser(
    companyId,
    {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || null
    },
    employee
  );

  res.json({
    token: signToken(user),
    user
  });
}

export async function meHandler(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw httpError(401, "Missing bearer token");

  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await getUserById(decoded.sub);
  if (!user) throw httpError(401, "User not found");
  res.json(user);
}
