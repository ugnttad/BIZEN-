import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/db.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { isTime } from "../../shared/validation.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const settingsRouter = Router();

const nullableLatitude = z.preprocess((value) => (value === "" || value === null || value === undefined ? null : Number(value)), z.number().min(-90).max(90).nullable());
const nullableLongitude = z.preprocess((value) => (value === "" || value === null || value === undefined ? null : Number(value)), z.number().min(-180).max(180).nullable());
const optionalLatitude = z.preprocess((value) => (value === "" || value === null || value === undefined ? undefined : Number(value)), z.number().min(-90).max(90).optional());
const optionalLongitude = z.preprocess((value) => (value === "" || value === null || value === undefined ? undefined : Number(value)), z.number().min(-180).max(180).optional());

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

const placeSuggestionsSchema = z.object({
  input: z.string().trim().min(2).max(120),
  latitude: optionalLatitude,
  longitude: optionalLongitude
});

const placeDetailsSchema = z.object({
  placeId: z.string().trim().min(4).max(256),
  text: z.string().trim().min(2).max(180).optional(),
  latitude: optionalLatitude,
  longitude: optionalLongitude
});

const defaultPlaceBias = {
  latitude: 16.0678,
  longitude: 108.2208
};

const placeAutocompleteFieldMask = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.text.text",
  "suggestions.placePrediction.structuredFormat.mainText.text",
  "suggestions.placePrediction.structuredFormat.secondaryText.text"
].join(",");

const placeDetailsFieldMask = ["id", "formattedAddress", "location"].join(",");
const placeTextSearchFieldMask = ["places.id", "places.formattedAddress", "places.location"].join(",");

function googlePlacesHeaders(fieldMask) {
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": env.googleMapsApiKey,
    "X-Goog-FieldMask": fieldMask
  };
}

function googlePlacesErrorMessage(payload, fallback) {
  if (payload?.error?.message) return payload.error.message;
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  return fallback;
}

async function readGooglePlacesError(response, fallback) {
  const payload = await response.json().catch(() => null);
  return googlePlacesErrorMessage(payload, fallback);
}

function describeGooglePlacesIssue(status, message) {
  const normalizedMessage = (message || "").toLowerCase();

  if (status === 403 || normalizedMessage.includes("permission")) {
    return {
      code: "GOOGLE_PLACES_PERMISSION_DENIED",
      message:
        "Google Places key chưa có quyền. Hãy bật Places API/Places API (New), bật billing, đặt API restrictions cho phép Places API và để Application restrictions là None khi gọi qua backend."
    };
  }

  if (status === 400 || normalizedMessage.includes("api key not valid") || normalizedMessage.includes("invalid")) {
    return {
      code: "GOOGLE_PLACES_INVALID_KEY",
      message: "GOOGLE_MAPS_API_KEY chưa hợp lệ hoặc đang copy sai key trong BE/.env."
    };
  }

  if (status === 429 || normalizedMessage.includes("quota")) {
    return {
      code: "GOOGLE_PLACES_QUOTA_EXCEEDED",
      message: "Google Places key đã hết quota hoặc đang bị giới hạn billing."
    };
  }

  return {
    code: "GOOGLE_PLACES_UNAVAILABLE",
    message: message || "Google Places tạm thời chưa khả dụng."
  };
}

function buildLocationBias(latitude, longitude) {
  return {
    circle: {
      center: {
        latitude: latitude ?? defaultPlaceBias.latitude,
        longitude: longitude ?? defaultPlaceBias.longitude
      },
      radius: 30000
    }
  };
}

function mapPlaceSuggestion(suggestion) {
  const prediction = suggestion.placePrediction;
  if (!prediction?.placeId) return null;

  return {
    placeId: prediction.placeId,
    text: prediction.text?.text || "",
    mainText: prediction.structuredFormat?.mainText?.text || prediction.text?.text || "",
    secondaryText: prediction.structuredFormat?.secondaryText?.text || ""
  };
}

function mapGooglePlace(payload, fallbackPlaceId = "") {
  const name = payload?.formattedAddress || "";

  return {
    placeId: payload?.id || fallbackPlaceId,
    name,
    address: payload?.formattedAddress || name,
    latitude: payload?.location?.latitude ?? null,
    longitude: payload?.location?.longitude ?? null
  };
}

function hasPlaceCoordinates(place) {
  return typeof place?.latitude === "number" && typeof place?.longitude === "number";
}

async function searchPlaceByText(text, latitude, longitude) {
  if (!text) return null;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: googlePlacesHeaders(placeTextSearchFieldMask),
    body: JSON.stringify({
      textQuery: text,
      languageCode: "vi",
      regionCode: "VN",
      locationBias: buildLocationBias(latitude, longitude)
    })
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const firstPlace = payload.places?.[0];
  return firstPlace ? mapGooglePlace(firstPlace) : null;
}

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
  "/place-suggestions",
  asyncHandler(async (req, res) => {
    const { input, latitude, longitude } = placeSuggestionsSchema.parse(req.query);

    if (!env.googleMapsApiKey) {
      res.json({ configured: false, suggestions: [] });
      return;
    }

    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: googlePlacesHeaders(placeAutocompleteFieldMask),
      body: JSON.stringify({
        input,
        languageCode: "vi",
        regionCode: "vn",
        includedRegionCodes: ["vn"],
        locationBias: buildLocationBias(latitude, longitude)
      })
    });

    if (!response.ok) {
      const message = await readGooglePlacesError(response, "Google Places không trả được gợi ý địa chỉ.");
      const issue = describeGooglePlacesIssue(response.status, message);
      res.json({ configured: false, suggestions: [], issue });
      return;
    }

    const payload = await response.json();
    const suggestions = (payload.suggestions || [])
      .map(mapPlaceSuggestion)
      .filter(Boolean)
      .slice(0, 5);

    res.json({ configured: true, suggestions });
  })
);

settingsRouter.get(
  "/place-details",
  asyncHandler(async (req, res) => {
    const { placeId, text, latitude, longitude } = placeDetailsSchema.parse(req.query);

    if (!env.googleMapsApiKey) {
      res.json({ configured: false, place: null });
      return;
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: googlePlacesHeaders(placeDetailsFieldMask)
    });

    if (!response.ok) {
      const placeFromText = await searchPlaceByText(text, latitude, longitude);
      if (hasPlaceCoordinates(placeFromText)) {
        res.json({ configured: true, place: placeFromText, fallback: "text-search" });
        return;
      }

      const message = await readGooglePlacesError(response, "Google Places không trả được chi tiết địa điểm.");
      const issue = describeGooglePlacesIssue(response.status, message);
      res.json({ configured: false, place: null, issue });
      return;
    }

    const payload = await response.json();
    const place = mapGooglePlace(payload, placeId);

    if (!hasPlaceCoordinates(place)) {
      const placeFromText = await searchPlaceByText(text || place.address || place.name, latitude, longitude);
      if (hasPlaceCoordinates(placeFromText)) {
        res.json({ configured: true, place: placeFromText, fallback: "text-search" });
        return;
      }
    }

    res.json({ configured: true, place });
  })
);

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
