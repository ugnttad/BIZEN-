import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { listAttendanceHandler, upsertAttendanceHandler } from "./attendance.controller.js";

export const attendanceRouter = Router();

attendanceRouter.get("/", asyncHandler(listAttendanceHandler));
attendanceRouter.post("/", asyncHandler(upsertAttendanceHandler));
