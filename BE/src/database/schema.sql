CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Da Nang',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_unique_idx ON companies(name);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_headcount INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id),
  position TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'HR', 'Manager', 'Employee')),
  contract_type TEXT NOT NULL,
  base_salary NUMERIC(14, 0) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Active', 'On leave', 'Inactive')),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  start_date DATE,
  manager_name TEXT,
  shift_id TEXT,
  leave_remaining NUMERIC(5, 1) NOT NULL DEFAULT 0,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time_range TEXT NOT NULL,
  short_time TEXT NOT NULL,
  required_count INTEGER NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  check_in TEXT,
  check_out TEXT,
  total_hours NUMERIC(5, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Late', 'Absent', 'Leave', 'Overtime')),
  location TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);

CREATE TABLE IF NOT EXISTS schedule_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  label TEXT NOT NULL,
  display_date TEXT NOT NULL,
  UNIQUE (company_id, work_date)
);

CREATE TABLE IF NOT EXISTS schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_day_id UUID REFERENCES schedule_days(id) ON DELETE CASCADE,
  shift_id TEXT REFERENCES shifts(id),
  employee_ids TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (schedule_day_id, shift_id)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, month)
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  base_salary NUMERIC(14, 0) NOT NULL,
  working_days NUMERIC(5, 1) NOT NULL,
  overtime_hours NUMERIC(6, 2) NOT NULL,
  overtime_pay NUMERIC(14, 0) NOT NULL,
  bonus NUMERIC(14, 0) NOT NULL,
  deduction NUMERIC(14, 0) NOT NULL,
  final_salary NUMERIC(14, 0) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Reviewed', 'Approved', 'Paid')),
  UNIQUE (payroll_run_id, employee_id)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days NUMERIC(5, 1) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  approver TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notify_time TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_alerts (
  id SERIAL PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  work_start TEXT NOT NULL DEFAULT '08:00',
  work_end TEXT NOT NULL DEFAULT '17:00',
  late_grace_minutes INTEGER NOT NULL DEFAULT 10,
  payroll_formula TEXT NOT NULL,
  overtime_formula TEXT NOT NULL,
  annual_leave_days INTEGER NOT NULL DEFAULT 12
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance_records(work_date);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);
