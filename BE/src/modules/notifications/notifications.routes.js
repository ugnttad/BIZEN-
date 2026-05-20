import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId || "BZN017";
    const result = await query(
      `SELECT id, title, body, notify_time AS time, type FROM notifications WHERE employee_id = $1 ORDER BY created_at DESC`,
      [employeeId]
    );
    res.json(result.rows);
  })
);
