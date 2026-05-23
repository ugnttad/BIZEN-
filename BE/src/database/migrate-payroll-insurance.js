import pg from "pg";
import "dotenv/config";
import { assertEnv } from "../config/env.js";

assertEnv();

const sql = `
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS bhxh_employee NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS bhyt_employee NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS bhtn_employee NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS other_deduction NUMERIC(14, 0) NOT NULL DEFAULT 0;
`;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
await client.end();
console.log("Đã thêm cột bảo hiểm vào payroll_items.");
