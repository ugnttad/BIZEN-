import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { getUserById } from "./auth.repository.js";
import { getPlatformAdminUser, isPlatformAdminTokenPayload } from "./platformAdmin.js";

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    if (isPlatformAdminTokenPayload(decoded)) {
      req.user = getPlatformAdminUser();
      next();
      return;
    }

    const user = await getUserById(decoded.sub);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (user.status !== "Approved") {
      res.status(403).json({ error: "Account is not approved" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}
