import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { query } from "../../config/db.js";

export const shiftsRouter = Router();

shiftsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await query(
      `SELECT id, name, time_range AS time, short_time AS "shortTime", required_count AS required, color FROM shifts ORDER BY short_time`
    );
    res.json(result.rows);
  })
);
