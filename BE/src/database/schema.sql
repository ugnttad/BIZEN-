CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Da Nang',
  business_type TEXT,
  business_address TEXT,
  tax_code TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_unique_idx ON companies(name);
CREATE UNIQUE INDEX IF NOT EXISTS companies_tax_code_unique_idx ON companies(tax_code) WHERE tax_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS company_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Da Nang',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT NOT NULL DEFAULT 'Cafe / Milk tea',
  business_address TEXT NOT NULL DEFAULT '',
  tax_code TEXT,
  website TEXT,
  verification_note TEXT NOT NULL DEFAULT '',
  employee_count INTEGER NOT NULL DEFAULT 20,
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
CREATE INDEX IF NOT EXISTS idx_company_access_requests_tax_code ON company_access_requests(tax_code) WHERE tax_code IS NOT NULL;

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
  pay_type TEXT NOT NULL DEFAULT 'Monthly' CHECK (pay_type IN ('Monthly', 'Hourly')),
  base_salary NUMERIC(14, 0) NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(14, 0) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Active', 'On leave', 'Inactive')),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  start_date DATE,
  manager_name TEXT,
  shift_id TEXT,
  leave_remaining NUMERIC(5, 1) NOT NULL DEFAULT 0,
  address TEXT,
  avatar_url TEXT,
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
  pay_type TEXT NOT NULL DEFAULT 'Monthly' CHECK (pay_type IN ('Monthly', 'Hourly')),
  base_salary NUMERIC(14, 0) NOT NULL,
  hourly_rate NUMERIC(14, 0) NOT NULL DEFAULT 0,
  working_days NUMERIC(5, 1) NOT NULL,
  total_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  regular_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(6, 2) NOT NULL,
  overtime_pay NUMERIC(14, 0) NOT NULL,
  bonus NUMERIC(14, 0) NOT NULL,
  deduction NUMERIC(14, 0) NOT NULL,
  final_salary NUMERIC(14, 0) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Reviewed', 'Approved', 'Paid')),
  UNIQUE (payroll_run_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('Addition', 'Deduction')),
  category TEXT NOT NULL,
  amount NUMERIC(14, 0) NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_company_month ON payroll_adjustments(company_id, month);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_employee_month ON payroll_adjustments(employee_id, month);

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

CREATE TABLE IF NOT EXISTS kpi_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL,
  default_due_offset_minutes INTEGER NOT NULL DEFAULT 60,
  requires_photo BOOLEAN NOT NULL DEFAULT true,
  min_photo_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shift_kpi_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES kpi_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_at TIMESTAMPTZ NOT NULL,
  requires_photo BOOLEAN NOT NULL DEFAULT true,
  min_photo_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'InProgress', 'Submitted', 'Approved', 'Rejected')),
  employee_note TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shift_kpi_task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES shift_kpi_tasks(id) ON DELETE CASCADE,
  image_data BYTEA NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance_records(work_date);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_kpi_tasks_company_date ON shift_kpi_tasks(company_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_shift_kpi_tasks_employee_date ON shift_kpi_tasks(employee_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_shift_kpi_tasks_status ON shift_kpi_tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_shift_kpi_task_photos_task ON shift_kpi_task_photos(task_id);

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  picture_url TEXT,
  password_hash TEXT,
  request_full_name TEXT,
  request_phone TEXT,
  request_citizen_id TEXT,
  request_date_of_birth DATE,
  request_address TEXT,
  request_note TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Employee')),
  status TEXT NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Suspended')),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Approved';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS request_full_name TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS request_phone TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS request_citizen_id TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS request_date_of_birth DATE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS request_address TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS request_note TEXT;

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

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  sender_employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_company_created ON community_messages(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_typing (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  sender_employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, sender_user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_typing_active ON community_typing(company_id, is_typing, updated_at DESC);

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
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_type TEXT NOT NULL DEFAULT 'Monthly';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS pay_type TEXT NOT NULL DEFAULT 'Monthly';
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS total_hours NUMERIC(6, 2) NOT NULL DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS regular_hours NUMERIC(6, 2) NOT NULL DEFAULT 0;

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS location_accuracy_meters INTEGER;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS distance_from_store_meters INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;


ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_address TEXT NOT NULL DEFAULT 'Hải Châu, Đà Nẵng';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_latitude NUMERIC(10, 7) DEFAULT 16.0678000;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_longitude NUMERIC(10, 7) DEFAULT 108.2208000;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER NOT NULL DEFAULT 200;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN NOT NULL DEFAULT true;
