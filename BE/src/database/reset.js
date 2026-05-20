import { pool } from "../config/db.js";
import { assertEnv } from "../config/env.js";

assertEnv();

await pool.query(`
  DROP TABLE IF EXISTS
    app_settings,
    ai_alerts,
    notifications,
    leave_requests,
    payroll_items,
    payroll_runs,
    schedule_slots,
    schedule_days,
    attendance_records,
    shifts,
    employees,
    departments,
    companies
  CASCADE;
`);

await pool.end();

console.log("Database reset completed.");
