import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { listAttendanceHandler, listEmployeeAttendanceHandler, upsertAttendanceHandler } from "./attendance.controller.js";

export const attendanceRouter = Router();

attendanceRouter.get("/", asyncHandler(listAttendanceHandler));
attendanceRouter.get("/employee/:employeeId", asyncHandler(listEmployeeAttendanceHandler));
attendanceRouter.post("/", asyncHandler(upsertAttendanceHandler));
