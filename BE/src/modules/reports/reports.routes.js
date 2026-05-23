import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getBusinessDate } from "../../shared/businessDate.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const today = getBusinessDate();
    const [attendanceSummary, payrollSummary, lateResult, overtimeResult, leaveResult, departmentResult, payrollTrend] = await Promise.all([
      query(
        `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status IN ('Present', 'Overtime'))::int AS "onTime",
          COUNT(*) FILTER (WHERE status = 'Late')::int AS late,
          COUNT(*) FILTER (WHERE status = 'Leave')::int AS leave
         FROM attendance_records
         WHERE company_id = $1 AND work_date = $2`,
        [companyId, today]
      ),
      query(
        `SELECT
          COALESCE(SUM(pi.final_salary), 0)::int AS "totalPayroll",
          COALESCE(SUM(pi.overtime_hours), 0)::float AS "totalOt",
          COALESCE(SUM(pi.overtime_pay), 0)::int AS "totalOtPay",
          COUNT(pi.id)::int AS "payrollItems"
         FROM payroll_runs pr
         LEFT JOIN payroll_items pi ON pi.payroll_run_id = pr.id
         WHERE pr.company_id = $1 AND pr.month = '05/2026'`,
        [companyId]
      ),
      query(
        `SELECT e.name, COUNT(a.id)::int AS late
         FROM attendance_records a
         JOIN employees e ON e.id = a.employee_id
         WHERE a.company_id = $1 AND a.status = 'Late'
         GROUP BY e.id
         ORDER BY late DESC, e.name
         LIMIT 5`,
        [companyId]
      ),
      query(
        `SELECT d.name AS department, COALESCE(SUM(pi.overtime_hours), 0)::float AS hours
         FROM departments d
         LEFT JOIN employees e ON e.department_id = d.id AND e.company_id = d.company_id
         LEFT JOIN payroll_runs pr ON pr.company_id = d.company_id AND pr.month = '05/2026'
         LEFT JOIN payroll_items pi ON pi.payroll_run_id = pr.id AND pi.employee_id = e.id
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
      query(
        `SELECT
          (SELECT COALESCE(SUM(days), 0)::float FROM leave_requests WHERE company_id = $1 AND status = 'Approved') AS used,
          (SELECT COALESCE(SUM(leave_remaining), 0)::float FROM employees WHERE company_id = $1) AS remaining`,
        [companyId]
      ),
      query(
        `SELECT
          d.name AS department,
          COUNT(e.id)::int AS employees,
          COALESCE(ROUND(
            100.0 * COUNT(a.id) FILTER (WHERE a.status IN ('Present', 'Overtime')) / NULLIF(COUNT(a.id), 0)
          ), 0)::int AS productivity,
          COALESCE(ROUND(
            100.0 * COUNT(a.id) FILTER (WHERE a.status = 'Leave') / NULLIF(COUNT(a.id), 0)
          ), 0)::int AS "leaveRate"
         FROM departments d
         LEFT JOIN employees e ON e.department_id = d.id AND e.company_id = d.company_id
         LEFT JOIN attendance_records a ON a.employee_id = e.id AND a.company_id = d.company_id AND a.work_date = $2
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
        [companyId, today]
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

    const attendance = attendanceSummary.rows[0] || { total: 0, onTime: 0, late: 0, leave: 0 };
    const payroll = payrollSummary.rows[0] || { totalPayroll: 0, totalOt: 0, totalOtPay: 0, payrollItems: 0 };
    const leave = leaveResult.rows[0] || { used: 0, remaining: 0 };

    res.json({
      summary: {
        onTimeRate: attendance.total ? Math.round((attendance.onTime / attendance.total) * 100) : 0,
        lateCount: attendance.late,
        leaveRate: attendance.total ? Number(((attendance.leave / attendance.total) * 100).toFixed(1)) : 0,
        totalOt: payroll.totalOt,
        totalOtPay: payroll.totalOtPay,
        totalPayroll: payroll.totalPayroll,
        payrollItems: payroll.payrollItems
      },
      lateData: lateResult.rows,
      overtimeData: overtimeResult.rows,
      leavePie: [
        { name: "Đã dùng", value: leave.used },
        { name: "Còn lại", value: leave.remaining }
      ],
      departmentPerformance: departmentResult.rows,
      payrollTrend: payrollTrend.rows
    });
  })
);
