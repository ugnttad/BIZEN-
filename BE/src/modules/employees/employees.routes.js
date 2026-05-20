import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { createEmployeeHandler, deleteEmployeeHandler, getEmployeeHandler, listEmployeesHandler, updateEmployeeHandler } from "./employees.controller.js";

export const employeesRouter = Router();

employeesRouter.get("/", asyncHandler(listEmployeesHandler));
employeesRouter.get("/:id", asyncHandler(getEmployeeHandler));
employeesRouter.post("/", asyncHandler(createEmployeeHandler));
employeesRouter.patch("/:id", asyncHandler(updateEmployeeHandler));
employeesRouter.delete("/:id", asyncHandler(deleteEmployeeHandler));
