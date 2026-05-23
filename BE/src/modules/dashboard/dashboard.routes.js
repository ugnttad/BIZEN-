import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getBusinessDate } from "../../shared/businessDate.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const today = getBusinessDate();
    const [employeesResult, attendanceResult, payrollResult, departmentsResult, alertsResult] = await Promise.all([
      query("SELECT COUNT(*)::int AS total FROM employees WHERE company_id = $1", [companyId]),
      query(
        `SELECT
          COUNT(*) FILTER (WHERE check_in IS NOT NULL)::int AS "checkedIn",
          COUNT(*) FILTER (WHERE status = 'Late')::int AS late,
          COUNT(*) FILTER (WHERE status = 'Leave')::int AS leave
         FROM attendance_records
         WHERE company_id = $1 AND work_date = $2`,
        [companyId, today]
      ),
      query(
        `SELECT COALESCE(SUM(pi.final_salary), 0)::int AS total
         FROM payroll_items pi
         JOIN payroll_runs pr ON pr.id = pi.payroll_run_id
         WHERE pr.company_id = $1`,
        [companyId]
      ),
      query(
        `SELECT
          d.name AS department,
          COUNT(e.id)::int AS employees,
          d.target_headcount AS "targetHeadcount",
          COUNT(e.id) FILTER (WHERE e.status = 'Active')::int AS "activeCount",
          COUNT(e.id) FILTER (WHERE e.status = 'On leave')::int AS "onLeaveCount"
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
      ),
      query("SELECT id, alert_type AS type, title, detail FROM ai_alerts WHERE company_id = $1 ORDER BY id", [companyId])
    ]);

    res.json({
      employees: employeesResult.rows[0].total,
      ...attendanceResult.rows[0],
      payrollTotal: payrollResult.rows[0].total,
      departments: departmentsResult.rows,
      aiAlerts: alertsResult.rows
    });
  })
);

dashboardRouter.get(
  "/charts",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const [attendanceResult, payrollResult] = await Promise.all([
      query(
        `SELECT
          CASE EXTRACT(ISODOW FROM sd.work_date)::int
            WHEN 1 THEN 'T2'
            WHEN 2 THEN 'T3'
            WHEN 3 THEN 'T4'
            WHEN 4 THEN 'T5'
            WHEN 5 THEN 'T6'
            WHEN 6 THEN 'T7'
            ELSE 'CN'
          END AS day,
          COUNT(a.id) FILTER (WHERE a.status = 'Present')::int AS present,
          COUNT(a.id) FILTER (WHERE a.status = 'Late')::int AS late,
          COUNT(a.id) FILTER (WHERE a.status = 'Leave')::int AS leave,
          COUNT(a.id) FILTER (WHERE a.status = 'Absent')::int AS absent,
          COUNT(a.id) FILTER (WHERE a.status = 'Overtime')::int AS overtime
         FROM schedule_days sd
         LEFT JOIN attendance_records a ON a.company_id = sd.company_id AND a.work_date = sd.work_date
         WHERE sd.company_id = $1
         GROUP BY sd.work_date
         ORDER BY sd.work_date`,
        [companyId]
      ),
      query(
        `SELECT
          to_char(to_date('01/' || pr.month, 'DD/MM/YYYY'), 'MM/YY') AS month,
          COALESCE(SUM(pi.final_salary), 0)::int AS payroll,
          COALESCE(SUM(pi.overtime_pay), 0)::int AS overtime
         FROM payroll_runs pr
         LEFT JOIN payroll_items pi ON pi.payroll_run_id = pr.id
         WHERE pr.company_id = $1
         GROUP BY pr.month
         ORDER BY to_date('01/' || pr.month, 'DD/MM/YYYY')`,
        [companyId]
      )
    ]);

    res.json({
      weeklyAttendance: attendanceResult.rows,
      payrollTrend: payrollResult.rows
    });
  })
);
