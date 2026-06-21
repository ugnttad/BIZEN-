import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { deletePushSubscription, ensurePushSchema, isPushConfigured, savePushSubscription } from "./push.service.js";

export const notificationsRouter = Router();

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.union([z.number(), z.null()]).optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const employeeId = req.query.employeeId || req.user.employeeId;
    if (!employeeId) throw httpError(400, "employeeId is required");
    if (req.user.role === "Employee" && employeeId !== req.user.employeeId) {
      throw httpError(403, "Employees can only access their own notifications");
    }

    const result = await query(
      `SELECT id, title, body, notify_time AS time, type
       FROM notifications
       WHERE company_id = $1 AND employee_id = $2
       ORDER BY created_at DESC`,
      [companyId, employeeId]
    );
    res.json(result.rows);
  })
);

notificationsRouter.get(
  "/push/public-key",
  asyncHandler(async (_req, res) => {
    res.json({
      enabled: isPushConfigured(),
      publicKey: isPushConfigured() ? env.vapidPublicKey : ""
    });
  })
);

notificationsRouter.post(
  "/push/subscribe",
  asyncHandler(async (req, res) => {
    if (!isPushConfigured()) throw httpError(503, "Push notification chưa cấu hình VAPID key.");
    const companyId = await getCompanyIdForUser(req.user);
    const subscription = pushSubscriptionSchema.parse(req.body?.subscription ?? req.body ?? {});
    await savePushSubscription({
      companyId,
      user: req.user,
      subscription,
      userAgent: req.headers["user-agent"]
    });
    res.status(201).json({ ok: true });
  })
);

notificationsRouter.post(
  "/push/unsubscribe",
  asyncHandler(async (req, res) => {
    await ensurePushSchema();
    await deletePushSubscription(req.body?.endpoint);
    res.status(204).end();
  })
);
