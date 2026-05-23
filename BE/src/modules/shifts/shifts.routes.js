import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { query } from "../../config/db.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const shiftsRouter = Router();

shiftsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `SELECT id, name, time_range AS time, short_time AS "shortTime", required_count AS required, color FROM shifts WHERE company_id = $1 ORDER BY short_time`,
      [companyId]
    );
    res.json(result.rows);
  })
);
