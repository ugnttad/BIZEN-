import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireRoles } from "../auth/auth.middleware.js";
import { requireEmployeeLimit } from "../../shared/plan.middleware.js";
import { createEmployeeHandler, deleteEmployeeHandler, getEmployeeHandler, listEmployeesHandler, updateEmployeeHandler } from "./employees.controller.js";

export const employeesRouter = Router();

employeesRouter.get("/", asyncHandler(listEmployeesHandler));
employeesRouter.get("/:id", asyncHandler(getEmployeeHandler));
employeesRouter.post("/", requireRoles("Admin"), requireEmployeeLimit, asyncHandler(createEmployeeHandler));
employeesRouter.patch("/:id", requireRoles("Admin"), asyncHandler(updateEmployeeHandler));
employeesRouter.delete("/:id", requireRoles("Admin"), asyncHandler(deleteEmployeeHandler));
