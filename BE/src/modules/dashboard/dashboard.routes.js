import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [employeesResult, attendanceResult, payrollResult, departmentsResult, alertsResult] = await Promise.all([
      query("SELECT COUNT(*)::int AS total FROM employees"),
      query(
        `SELECT
          COUNT(*) FILTER (WHERE check_in IS NOT NULL)::int AS "checkedIn",
          COUNT(*) FILTER (WHERE status = 'Late')::int AS late,
          COUNT(*) FILTER (WHERE status = 'Leave')::int AS leave
         FROM attendance_records
         WHERE work_date = '2026-05-20'`
      ),
      query("SELECT COALESCE(SUM(final_salary), 0)::int AS total FROM payroll_items"),
      query(
        `SELECT d.name AS department, COUNT(e.id)::int AS employees
         FROM departments d
         LEFT JOIN employees e ON e.department_id = d.id
         GROUP BY d.id
         ORDER BY
          CASE d.id
            WHEN 'sales' THEN 1
            WHEN 'hr' THEN 2
            WHEN 'warehouse' THEN 3
            WHEN 'admin' THEN 4
            WHEN 'support' THEN 5
            ELSE 6
          END`
      ),
      query("SELECT id, alert_type AS type, title, detail FROM ai_alerts ORDER BY id")
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
  asyncHandler(async (_req, res) => {
    res.json({
      weeklyAttendance: [
        { day: "T2", present: 18, late: 2, leave: 1, absent: 1 },
        { day: "T3", present: 17, late: 3, leave: 2, absent: 1 },
        { day: "T4", present: 16, late: 3, leave: 2, absent: 1 },
        { day: "T5", present: 18, late: 1, leave: 1, absent: 0 },
        { day: "T6", present: 17, late: 2, leave: 1, absent: 0 },
        { day: "T7", present: 11, late: 1, leave: 0, absent: 0 }
      ],
      payrollTrend: [
        { month: "01/26", payroll: 238000000, overtime: 11200000 },
        { month: "02/26", payroll: 244000000, overtime: 13600000 },
        { month: "03/26", payroll: 251000000, overtime: 15100000 },
        { month: "04/26", payroll: 247000000, overtime: 12800000 },
        { month: "05/26", payroll: 256800000, overtime: 17300000 }
      ]
    });
  })
);
