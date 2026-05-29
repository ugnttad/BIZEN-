import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireRoles } from "../auth/auth.middleware.js";
import {
  checkinPolicyHandler,
  faceCheckinHandler,
  faceReadinessHandler,
  listAttendanceHandler,
  listEmployeeAttendanceHandler,
  upsertAttendanceHandler
} from "./attendance.controller.js";
import {
  faceEnrollmentImageHandler,
  faceEnrollHandler,
  latestFaceEnrollmentHandler,
  listFaceEnrollmentsHandler,
  reviewFaceEnrollmentHandler
} from "./faceEnrollment.controller.js";

export const attendanceRouter = Router();

attendanceRouter.get("/", requireRoles("Admin"), asyncHandler(listAttendanceHandler));
attendanceRouter.get("/face-enrollments", requireRoles("Admin"), asyncHandler(listFaceEnrollmentsHandler));
attendanceRouter.get("/face-enrollments/employee/:employeeId/latest", asyncHandler(latestFaceEnrollmentHandler));
attendanceRouter.get("/face-enrollments/:id/image", requireRoles("Admin"), asyncHandler(faceEnrollmentImageHandler));
attendanceRouter.get("/checkin-policy", asyncHandler(checkinPolicyHandler));
attendanceRouter.get("/employee/:employeeId", asyncHandler(listEmployeeAttendanceHandler));
attendanceRouter.post("/", requireRoles("Admin"), asyncHandler(upsertAttendanceHandler));
attendanceRouter.post("/face-enroll", asyncHandler(faceEnrollHandler));
attendanceRouter.post("/face-readiness", asyncHandler(faceReadinessHandler));
attendanceRouter.post("/face-checkin", asyncHandler(faceCheckinHandler));
attendanceRouter.patch("/face-enrollments/:id/status", requireRoles("Admin"), asyncHandler(reviewFaceEnrollmentHandler));
