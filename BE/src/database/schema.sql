CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Da Nang',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_unique_idx ON companies(name);

CREATE TABLE IF NOT EXISTS company_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Da Nang',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  admin_password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  reviewed_by TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_access_requests_status ON company_access_requests(status, requested_at DESC);

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
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Employee')),
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
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  location_accuracy_meters INTEGER,
  distance_from_store_meters INTEGER,
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

CREATE TABLE IF NOT EXISTS employee_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  busy_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_id, busy_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_unavailability_company_date ON employee_unavailability(company_id, busy_date);
CREATE INDEX IF NOT EXISTS idx_employee_unavailability_employee_date ON employee_unavailability(employee_id, busy_date);

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
  annual_leave_days INTEGER NOT NULL DEFAULT 12,
  store_address TEXT NOT NULL DEFAULT 'Hải Châu, Đà Nẵng',
  store_latitude NUMERIC(10, 7) DEFAULT 16.0678000,
  store_longitude NUMERIC(10, 7) DEFAULT 108.2208000,
  geofence_radius_meters INTEGER NOT NULL DEFAULT 200,
  geofence_enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance_records(work_date);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  picture_url TEXT,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Employee')),
  status TEXT NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Suspended')),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Approved';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_users_status_check'
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_status_check
      CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_users_employee ON app_users(employee_id);
CREATE INDEX IF NOT EXISTS idx_app_users_company_status ON app_users(company_id, status);

CREATE TABLE IF NOT EXISTS face_enrollment_images (
  storage_key TEXT PRIMARY KEY,
  image_data BYTEA NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS face_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  image_storage_key TEXT NOT NULL,
  image_mime_type TEXT NOT NULL,
  face_confidence NUMERIC(6, 3),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Revoked')),
  rekognition_face_id TEXT,
  rekognition_collection_id TEXT,
  rejection_reason TEXT,
  reviewed_by TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_face_enrollments_employee_status ON face_enrollments(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_face_enrollments_status_requested ON face_enrollments(status, requested_at DESC);

ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS bhxh_employee NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS bhyt_employee NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS bhtn_employee NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS other_deduction NUMERIC(14, 0) NOT NULL DEFAULT 0;

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS location_accuracy_meters INTEGER;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS distance_from_store_meters INTEGER;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_address TEXT NOT NULL DEFAULT 'Hải Châu, Đà Nẵng';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_latitude NUMERIC(10, 7) DEFAULT 16.0678000;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_longitude NUMERIC(10, 7) DEFAULT 108.2208000;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER NOT NULL DEFAULT 200;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN NOT NULL DEFAULT true;
