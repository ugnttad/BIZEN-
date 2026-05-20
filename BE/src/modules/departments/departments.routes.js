import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";

export const departmentsRouter = Router();

departmentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await query(
      `SELECT
        id,
        name,
        target_headcount AS "targetHeadcount"
       FROM departments
       ORDER BY
        CASE id
          WHEN 'sales' THEN 1
          WHEN 'hr' THEN 2
          WHEN 'warehouse' THEN 3
          WHEN 'admin' THEN 4
          WHEN 'support' THEN 5
          ELSE 6
        END`
    );
    res.json(result.rows);
  })
);
