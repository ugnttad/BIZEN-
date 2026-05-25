import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { isTime } from "../../shared/validation.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const settingsRouter = Router();

const nullableLatitude = z.preprocess((value) => (value === "" || value === null || value === undefined ? null : Number(value)), z.number().min(-90).max(90).nullable());
const nullableLongitude = z.preprocess((value) => (value === "" || value === null || value === undefined ? null : Number(value)), z.number().min(-180).max(180).nullable());

const settingsSchema = z.object({
  workStart: z.string().refine(isTime, "Giờ bắt đầu chưa hợp lệ"),
  workEnd: z.string().refine(isTime, "Giờ kết thúc chưa hợp lệ"),
  lateGraceMinutes: z.coerce.number().int().min(0).max(60),
  payrollFormula: z.string().trim().min(5).max(500),
  overtimeFormula: z.string().trim().min(5).max(300),
  annualLeaveDays: z.coerce.number().int().min(0).max(24),
  storeAddress: z.string().trim().min(2).max(160).default("Hải Châu, Đà Nẵng"),
  storeLatitude: nullableLatitude.default(16.0678),
  storeLongitude: nullableLongitude.default(108.2208),
  geofenceRadiusMeters: z.coerce.number().int().min(30).max(2000).default(200),
  geofenceEnabled: z.coerce.boolean().default(true)
});

let settingsGeoSchemaReady = false;

async function ensureSettingsGeoSchema() {
  if (settingsGeoSchemaReady) return;

  await query(`
    ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_address TEXT NOT NULL DEFAULT 'Hải Châu, Đà Nẵng';
    ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_latitude NUMERIC(10, 7) DEFAULT 16.0678000;
    ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS store_longitude NUMERIC(10, 7) DEFAULT 108.2208000;
    ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER NOT NULL DEFAULT 200;
    ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN NOT NULL DEFAULT true;
  `);

  settingsGeoSchemaReady = true;
}

const settingsSelect = `
  work_start AS "workStart",
  work_end AS "workEnd",
  late_grace_minutes AS "lateGraceMinutes",
  payroll_formula AS "payrollFormula",
  overtime_formula AS "overtimeFormula",
  annual_leave_days AS "annualLeaveDays",
  store_address AS "storeAddress",
  store_latitude::float AS "storeLatitude",
  store_longitude::float AS "storeLongitude",
  geofence_radius_meters AS "geofenceRadiusMeters",
  geofence_enabled AS "geofenceEnabled"
`;

settingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await ensureSettingsGeoSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(`SELECT ${settingsSelect} FROM app_settings WHERE company_id = $1`, [companyId]);
    res.json(result.rows[0]);
  })
);

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    await ensureSettingsGeoSchema();
    const data = settingsSchema.parse(req.body);

    if (data.workStart === data.workEnd) {
      throw httpError(400, "Giờ bắt đầu và giờ kết thúc không được trùng nhau");
    }
    if (data.geofenceEnabled && (data.storeLatitude === null || data.storeLongitude === null)) {
      throw httpError(400, "Bật ràng buộc vị trí cần có tọa độ quán.");
    }

    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `INSERT INTO app_settings (
        company_id,
        work_start,
        work_end,
        late_grace_minutes,
        payroll_formula,
        overtime_formula,
        annual_leave_days,
        store_address,
        store_latitude,
        store_longitude,
        geofence_radius_meters,
        geofence_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (company_id) DO UPDATE SET
        work_start = EXCLUDED.work_start,
        work_end = EXCLUDED.work_end,
        late_grace_minutes = EXCLUDED.late_grace_minutes,
        payroll_formula = EXCLUDED.payroll_formula,
        overtime_formula = EXCLUDED.overtime_formula,
        annual_leave_days = EXCLUDED.annual_leave_days,
        store_address = EXCLUDED.store_address,
        store_latitude = EXCLUDED.store_latitude,
        store_longitude = EXCLUDED.store_longitude,
        geofence_radius_meters = EXCLUDED.geofence_radius_meters,
        geofence_enabled = EXCLUDED.geofence_enabled
      RETURNING ${settingsSelect}`,
      [
        companyId,
        data.workStart,
        data.workEnd,
        data.lateGraceMinutes,
        data.payrollFormula,
        data.overtimeFormula,
        data.annualLeaveDays,
        data.storeAddress,
        data.storeLatitude,
        data.storeLongitude,
        data.geofenceRadiusMeters,
        data.geofenceEnabled
      ]
    );

    res.json(result.rows[0]);
  })
);
