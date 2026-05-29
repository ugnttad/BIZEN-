import { z } from "zod";
import { env } from "../../config/env.js";
import { getBusinessDate, getBusinessTime } from "../../shared/businessDate.js";
import { httpError } from "../../shared/httpError.js";
import { isIsoDate, isTime } from "../../shared/validation.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import {
  getAttendanceRecord,
  getApprovedFaceEnrollment,
  getEmployeeAttendanceContext,
  listAttendance,
  listEmployeeAttendance,
  upsertAttendance
} from "./attendance.repository.js";
import { analyzeFaceImage, verifyEmployeeFace, verifyFaceLiveness } from "./faceVerification.service.js";

const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  workDate: z.string().refine(isIsoDate, "Ngày chấm công chưa hợp lệ"),
  checkIn: z.string().nullable().optional().refine((value) => !value || isTime(value), "Giờ vào chưa hợp lệ"),
  checkOut: z.string().nullable().optional().refine((value) => !value || isTime(value), "Giờ ra chưa hợp lệ"),
  totalHours: z.coerce.number().min(0).max(24).optional(),
  status: z.enum(["Present", "Late", "Absent", "Leave", "Overtime"]),
  location: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(300).optional()
});

const faceCheckinSchema = z.object({
  employeeId: z.string().min(1),
  image: z.string().min(200),
  livenessFrames: z
    .object({
      center: z.string().min(200),
      turnLeft: z.string().min(200),
      turnRight: z.string().min(200),
      blink: z.array(z.string().min(200)).min(1).max(6)
    })
    .optional(),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().trim().max(120).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  locationAccuracyMeters: z.coerce.number().min(0).max(10000).optional()
});

const faceReadinessSchema = z.object({
  employeeId: z.string().min(1).optional(),
  image: z.string().min(200)
});

function toMinutes(time) {
  const match = /^(\d{2}):(\d{2})$/.exec(time || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function calculateHours(checkIn, checkOut) {
  const start = toMinutes(checkIn);
  const end = toMinutes(checkOut);
  if (start === null || end === null) return 0;
  const adjustedEnd = end < start ? end + 24 * 60 : end;
  return Math.round(((adjustedEnd - start) / 60) * 100) / 100;
}

function resolveStatus(shiftStart, lateGraceMinutes, checkIn) {
  const shiftStartMinutes = toMinutes(shiftStart);
  const checkInMinutes = toMinutes(checkIn);
  if (shiftStartMinutes === null || checkInMinutes === null) return "Present";
  return checkInMinutes > shiftStartMinutes + lateGraceMinutes ? "Late" : "Present";
}

function resolveAttendanceEvent(existing, context, checkTime) {
  if (!existing?.checkIn) {
    return {
      action: "check-in",
      checkIn: checkTime,
      checkOut: existing?.checkOut || null,
      totalHours: existing?.totalHours || 0,
      status: resolveStatus(context.shiftStart, context.lateGraceMinutes, checkTime)
    };
  }

  return {
    action: "check-out",
    checkIn: existing.checkIn,
    checkOut: checkTime,
    totalHours: calculateHours(existing.checkIn, checkTime),
    status: ["Absent", "Leave"].includes(existing.status) ? resolveStatus(context.shiftStart, context.lateGraceMinutes, existing.checkIn) : existing.status
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(from, to) {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function resolveGeofence(payload, context) {
  if (!context.geofenceEnabled) {
    return {
      enabled: false,
      allowed: true,
      label: payload.location || "Mobile app"
    };
  }

  if (context.storeLatitude === null || context.storeLatitude === undefined || context.storeLongitude === null || context.storeLongitude === undefined) {
    throw httpError(409, "Chủ sở hữu chưa cấu hình tọa độ quán trong Settings.");
  }

  if (payload.latitude === undefined || payload.longitude === undefined) {
    throw httpError(400, "Cần cấp quyền vị trí GPS để chấm công tại quán.");
  }

  const distance = calculateDistanceMeters(
    { latitude: Number(context.storeLatitude), longitude: Number(context.storeLongitude) },
    { latitude: Number(payload.latitude), longitude: Number(payload.longitude) }
  );
  const accuracyAllowance = Math.min(Math.round(Number(payload.locationAccuracyMeters || 0)), 50);
  const radius = Number(context.geofenceRadiusMeters || 200);

  if (distance > radius + accuracyAllowance) {
    throw httpError(403, `Bạn đang cách quán khoảng ${distance}m, vượt bán kính cho phép ${radius}m.`);
  }

  return {
    enabled: true,
    allowed: true,
    distance,
    radius,
    accuracy: payload.locationAccuracyMeters ? Math.round(Number(payload.locationAccuracyMeters)) : null,
    label: `${context.storeAddress || "Quán"} (${distance}m)`
  };
}

function assertRealFaceEnrollment(enrollment) {
  if (env.faceIdAllowDemoMode) return;

  const isDemoEnrollment =
    !enrollment.rekognitionFaceId ||
    enrollment.rekognitionCollectionId === "local-demo" ||
    String(enrollment.rekognitionFaceId || "").startsWith("local-");

  if (isDemoEnrollment) {
    throw httpError(
      409,
      "Face ID hiện là bản demo cũ hoặc chưa được index vào AWS Rekognition. Vui lòng đăng ký lại khuôn mặt và để chủ sở hữu duyệt lại trước khi chấm công."
    );
  }
}

export async function listAttendanceHandler(req, res) {
  const companyId = await getCompanyIdForUser(req.user);
  res.json(await listAttendance({ date: req.query.date, companyId }));
}

export async function upsertAttendanceHandler(req, res) {
  const data = attendanceSchema.parse(req.body);
  const companyId = await getCompanyIdForUser(req.user);
  const context = await getEmployeeAttendanceContext(data.employeeId);
  if (!context) throw httpError(404, "Không tìm thấy nhân viên");
  if (context.companyId !== companyId) throw httpError(403, "Nhân viên thuộc doanh nghiệp khác");

  if (data.checkOut && !data.checkIn) {
    throw httpError(400, "Không thể có giờ ra khi chưa có giờ vào");
  }
  if (["Present", "Late", "Overtime"].includes(data.status) && !data.checkIn) {
    throw httpError(400, "Trạng thái đi làm cần có giờ vào");
  }
  if (["Absent", "Leave"].includes(data.status) && (data.checkIn || data.checkOut)) {
    throw httpError(400, "Trạng thái nghỉ/vắng không được có giờ vào hoặc giờ ra");
  }
  if (data.checkIn && data.checkOut) {
    data.totalHours = calculateHours(data.checkIn, data.checkOut);
  }

  res.status(201).json(await upsertAttendance(companyId, data));
}

export async function listEmployeeAttendanceHandler(req, res) {
  if (req.user.role === "Employee" && req.params.employeeId !== req.user.employeeId) {
    throw httpError(403, "Employees can only access their own attendance");
  }
  const companyId = await getCompanyIdForUser(req.user);
  res.json(await listEmployeeAttendance(req.params.employeeId, companyId));
}

export async function checkinPolicyHandler(req, res) {
  const employeeId = req.user.role === "Employee" ? req.user.employeeId : req.query.employeeId;
  if (!employeeId) {
    throw httpError(400, "Chọn nhân viên để xem chính sách chấm công.");
  }

  const context = await getEmployeeAttendanceContext(employeeId);
  if (!context) {
    throw httpError(404, "Employee not found");
  }
  if (req.user.companyId && context.companyId !== req.user.companyId) {
    throw httpError(403, "Employee belongs to another company");
  }

  res.json({
    storeAddress: context.storeAddress,
    geofenceEnabled: context.geofenceEnabled,
    geofenceRadiusMeters: context.geofenceRadiusMeters,
    faceIdDemoMode: env.faceIdAllowDemoMode,
    faceProvider: env.awsRekognitionEnabled ? "aws-rekognition" : "not-configured"
  });
}

export async function faceReadinessHandler(req, res) {
  const payload = faceReadinessSchema.parse(req.body);
  if (req.user.role === "Employee" && payload.employeeId && payload.employeeId !== req.user.employeeId) {
    throw httpError(403, "Employees can only analyze their own Face ID image");
  }

  const face = await analyzeFaceImage(payload.image);
  res.json({
    ready: Boolean(face.ready ?? face.valid),
    valid: Boolean(face.valid),
    reason: face.reason,
    provider: face.provider || "aws-rekognition",
    mode: face.mode,
    confidence: face.confidence,
    faceCount: face.faceCount,
    quality: face.quality,
    pose: face.pose,
    checks: face.checks || []
  });
}

export async function faceCheckinHandler(req, res) {
  const payload = faceCheckinSchema.parse(req.body);
  if (req.user.role === "Employee" && payload.employeeId !== req.user.employeeId) {
    throw httpError(403, "Employees can only check in as themselves");
  }

  const context = await getEmployeeAttendanceContext(payload.employeeId);
  if (!context) {
    throw httpError(404, "Employee not found");
  }
  if (req.user.companyId && context.companyId !== req.user.companyId) {
    throw httpError(403, "Employee belongs to another company");
  }

  const approvedEnrollment = await getApprovedFaceEnrollment(payload.employeeId, context.companyId);
  if (!approvedEnrollment) {
    throw httpError(409, "Face enrollment is not approved by the owner yet");
  }
  assertRealFaceEnrollment(approvedEnrollment);

  const liveness = await verifyFaceLiveness(payload.livenessFrames);
  if (!liveness.live) {
    throw httpError(422, liveness.reason || "Face liveness challenge failed");
  }

  const face = await verifyEmployeeFace(payload.employeeId, liveness.centerImage || payload.image);
  if (!face.verified) {
    throw httpError(422, face.reason || "Face verification failed");
  }

  const geofence = resolveGeofence(payload, context);
  const workDate = payload.workDate || getBusinessDate();
  const checkTime = getBusinessTime();
  const existing = await getAttendanceRecord(payload.employeeId, workDate, context.companyId);
  const event = resolveAttendanceEvent(existing, context, checkTime);
  const faceNote =
    face.provider === "local-demo"
      ? "Face ID demo mode: FACE_ID_ALLOW_DEMO_MODE=true"
      : `AWS Rekognition face match ${Math.round(face.similarity)}%`;
  const locationNote = geofence.enabled
    ? `GPS within ${geofence.distance}m/${geofence.radius}m${geofence.accuracy !== null ? `, accuracy ${geofence.accuracy}m` : ""}`
    : "GPS geofence disabled";
  const attendance = await upsertAttendance(context.companyId, {
    employeeId: payload.employeeId,
    workDate,
    checkIn: event.checkIn,
    checkOut: event.checkOut,
    totalHours: event.totalHours,
    status: event.status,
    location: geofence.label,
    latitude: payload.latitude,
    longitude: payload.longitude,
    locationAccuracyMeters: geofence.accuracy,
    distanceFromStoreMeters: geofence.distance,
    note: `${faceNote} · ${locationNote}`
  });

  res.status(201).json({
    verified: true,
    provider: face.provider || "aws-rekognition",
    mode: face.mode,
    warning: face.warning,
    liveness: {
      provider: liveness.provider || "aws-rekognition",
      mode: liveness.mode,
      checks: liveness.checks || []
    },
    action: event.action,
    employeeId: payload.employeeId,
    employeeName: context.employeeName,
    workDate,
    checkTime,
    attendance,
    geofence,
    face: {
      confidence: face.confidence,
      similarity: face.similarity,
      matchedEmployeeId: face.matchedEmployeeId,
      collectionId: face.collectionId,
      faceId: face.faceId,
      faceCount: face.faceCount,
      provider: face.provider || "aws-rekognition",
      mode: face.mode
    }
  });
}
