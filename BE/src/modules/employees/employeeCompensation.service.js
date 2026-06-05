import { withTransaction } from "../../config/db.js";

let compensationSchemaReady = false;
let compensationSchemaPromise = null;

export async function ensureEmployeeCompensationSchema() {
  if (compensationSchemaReady) return;
  if (!compensationSchemaPromise) {
    compensationSchemaPromise = withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('bizen'), hashtext('employee_compensation_v1'))");
      await client.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_type TEXT NOT NULL DEFAULT 'Monthly'");
      await client.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(14, 0) NOT NULL DEFAULT 0");
      await client.query("ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS pay_type TEXT NOT NULL DEFAULT 'Monthly'");
      await client.query("ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(14, 0) NOT NULL DEFAULT 0");
      await client.query("ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS total_hours NUMERIC(6, 2) NOT NULL DEFAULT 0");
      await client.query("ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS regular_hours NUMERIC(6, 2) NOT NULL DEFAULT 0");
      await client.query(`
        UPDATE employees
        SET pay_type = CASE
          WHEN lower(contract_type) LIKE '%part%' OR lower(contract_type) LIKE '%bán thời gian%' OR lower(contract_type) LIKE '%thời vụ%' THEN 'Hourly'
          ELSE 'Monthly'
        END
        WHERE pay_type IS NULL
          OR pay_type NOT IN ('Monthly', 'Hourly')
          OR lower(contract_type) LIKE '%part%'
          OR lower(contract_type) LIKE '%bán thời gian%'
          OR lower(contract_type) LIKE '%thời vụ%'
      `);
      await client.query(`
        UPDATE employees
        SET hourly_rate = GREATEST(10000, ROUND(base_salary / 120 / 1000) * 1000)
        WHERE pay_type = 'Hourly' AND hourly_rate = 0 AND base_salary > 0
      `);
      await client.query(`
        UPDATE payroll_items pi
        SET
          pay_type = e.pay_type,
          hourly_rate = e.hourly_rate
        FROM payroll_runs pr, employees e
        WHERE pr.id = pi.payroll_run_id
          AND e.company_id = pr.company_id
          AND e.id = pi.employee_id
          AND (pi.pay_type IS NULL OR pi.pay_type = 'Monthly')
          AND e.pay_type = 'Hourly'
      `);
    })
      .then(() => {
        compensationSchemaReady = true;
      })
      .catch((error) => {
        compensationSchemaPromise = null;
        throw error;
      });
  }

  await compensationSchemaPromise;
}
