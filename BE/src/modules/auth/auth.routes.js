import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { authenticate, requireRoles } from "./auth.middleware.js";
import {
  googleLoginHandler,
  listAccountRequestsHandler,
  meHandler,
  passwordLoginHandler,
  requestEmployeeAccountHandler,
  reviewAccountRequestHandler
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/google", asyncHandler(googleLoginHandler));
authRouter.post("/login", asyncHandler(passwordLoginHandler));
authRouter.post("/employee-account-requests", asyncHandler(requestEmployeeAccountHandler));
authRouter.get("/account-requests", authenticate, requireRoles("Admin", "HR"), asyncHandler(listAccountRequestsHandler));
authRouter.patch("/account-requests/:id/status", authenticate, requireRoles("Admin", "HR"), asyncHandler(reviewAccountRequestHandler));
authRouter.get("/me", asyncHandler(meHandler));
