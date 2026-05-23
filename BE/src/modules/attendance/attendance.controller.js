import { z } from "zod";
import { getBusinessDate, getBusinessTime } from "../../shared/businessDate.js";
import { httpError } from "../../shared/httpError.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import {
  getAttendanceRecord,
  getApprovedFaceEnrollment,
  getEmployeeAttendanceContext,
  listAttendance,
  listEmployeeAttendance,
  upsertAttendance
} from "./attendance.repository.js";
import { verifyEmployeeFace } from "./faceVerification.service.js";

const attendanceSchema = z.object({
  employeeId: z.string(),
  workDate: z.string(),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  totalHours: z.coerce.number().optional(),
  status: z.enum(["Present", "Late", "Absent", "Leave", "Overtime"]),
  location: z.string().nullable().optional(),
  note: z.string().optional()
});

const faceCheckinSchema = z.object({
  employeeId: z.string().min(1),
  image: z.string().min(200),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().trim().max(120).optional()
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

export async function listAttendanceHandler(req, res) {
  const companyId = await getCompanyIdForUser(req.user);
  res.json(await listAttendance({ date: req.query.date, companyId }));
}

export async function upsertAttendanceHandler(req, res) {
  const data = attendanceSchema.parse(req.body);
  const companyId = await getCompanyIdForUser(req.user);
  res.status(201).json(await upsertAttendance(companyId, data));
}

export async function listEmployeeAttendanceHandler(req, res) {
  if (req.user.role === "Employee" && req.params.employeeId !== req.user.employeeId) {
    throw httpError(403, "Employees can only access their own attendance");
  }
  const companyId = await getCompanyIdForUser(req.user);
  res.json(await listEmployeeAttendance(req.params.employeeId, companyId));
}

export async function faceCheckinHandler(req, res) {
  const payload = faceCheckinSchema.parse(req.body);
  if (req.user.role === "Employee" && payload.employeeId !== req.user.employeeId) {
    throw httpError(403, "Employees can only check in as themselves");
  }

  const approvedEnrollment = await getApprovedFaceEnrollment(payload.employeeId);
  if (!approvedEnrollment) {
    throw httpError(409, "Face enrollment is not approved by HR yet");
  }

  const face = await verifyEmployeeFace(payload.employeeId, payload.image);
  if (!face.verified) {
    throw httpError(422, face.reason || "Face verification failed");
  }

  const context = await getEmployeeAttendanceContext(payload.employeeId);
  if (!context) {
    throw httpError(404, "Employee not found");
  }
  if (req.user.companyId && context.companyId !== req.user.companyId) {
    throw httpError(403, "Employee belongs to another company");
  }

  const workDate = payload.workDate || getBusinessDate();
  const checkTime = getBusinessTime();
  const existing = await getAttendanceRecord(payload.employeeId, workDate, context.companyId);
  const event = resolveAttendanceEvent(existing, context, checkTime);
  const attendance = await upsertAttendance(context.companyId, {
    employeeId: payload.employeeId,
    workDate,
    checkIn: event.checkIn,
    checkOut: event.checkOut,
    totalHours: event.totalHours,
    status: event.status,
    location: payload.location || "Mobile app",
    note: `AWS Rekognition face match ${Math.round(face.similarity)}%`
  });

  res.status(201).json({
    verified: true,
    provider: "aws-rekognition",
    action: event.action,
    employeeId: payload.employeeId,
    employeeName: context.employeeName,
    workDate,
    checkTime,
    attendance,
    face: {
      confidence: face.confidence,
      similarity: face.similarity,
      matchedEmployeeId: face.matchedEmployeeId,
      collectionId: face.collectionId,
      faceId: face.faceId,
      faceCount: face.faceCount
    }
  });
}
