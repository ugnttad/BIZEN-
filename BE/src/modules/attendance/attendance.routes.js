import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireRoles } from "../auth/auth.middleware.js";
import { faceCheckinHandler, listAttendanceHandler, listEmployeeAttendanceHandler, upsertAttendanceHandler } from "./attendance.controller.js";
import {
  faceEnrollmentImageHandler,
  faceEnrollHandler,
  latestFaceEnrollmentHandler,
  listFaceEnrollmentsHandler,
  reviewFaceEnrollmentHandler
} from "./faceEnrollment.controller.js";

export const attendanceRouter = Router();

attendanceRouter.get("/", requireRoles("Admin", "HR", "Manager"), asyncHandler(listAttendanceHandler));
attendanceRouter.get("/face-enrollments", requireRoles("Admin", "HR"), asyncHandler(listFaceEnrollmentsHandler));
attendanceRouter.get("/face-enrollments/employee/:employeeId/latest", asyncHandler(latestFaceEnrollmentHandler));
attendanceRouter.get("/face-enrollments/:id/image", requireRoles("Admin", "HR"), asyncHandler(faceEnrollmentImageHandler));
attendanceRouter.get("/employee/:employeeId", asyncHandler(listEmployeeAttendanceHandler));
attendanceRouter.post("/", requireRoles("Admin", "HR"), asyncHandler(upsertAttendanceHandler));
attendanceRouter.post("/face-enroll", asyncHandler(faceEnrollHandler));
attendanceRouter.post("/face-checkin", asyncHandler(faceCheckinHandler));
attendanceRouter.patch("/face-enrollments/:id/status", requireRoles("Admin", "HR"), asyncHandler(reviewFaceEnrollmentHandler));
