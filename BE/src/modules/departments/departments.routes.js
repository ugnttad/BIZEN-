import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { ensureEmployeeCompensationSchema } from "../employees/employeeCompensation.service.js";

export const departmentsRouter = Router();

departmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await ensureEmployeeCompensationSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `SELECT
        d.id,
        d.name,
        d.target_headcount AS "targetHeadcount",
        COUNT(e.id)::int AS "employeeCount",
        COUNT(e.id) FILTER (WHERE e.status = 'Active')::int AS "activeCount",
        COUNT(e.id) FILTER (WHERE e.status = 'On leave')::int AS "onLeaveCount",
        COALESCE(SUM(CASE WHEN e.pay_type = 'Hourly' THEN e.hourly_rate * 120 ELSE e.base_salary END), 0)::int AS "baseSalaryTotal"
       FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id AND e.company_id = d.company_id
       WHERE d.company_id = $1
       GROUP BY d.id
       ORDER BY
        CASE d.id
          WHEN 'sales' THEN 1
          WHEN 'hr' THEN 2
          WHEN 'warehouse' THEN 3
          WHEN 'admin' THEN 4
          WHEN 'support' THEN 5
          ELSE 6
        END`,
      [companyId]
    );
    res.json(result.rows);
  })
);
