import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { authenticate, requireRoles } from "./auth.middleware.js";
import {
  googleRedirectLoginHandler,
  googleLoginHandler,
  listAccountRequestsHandler,
  meHandler,
  passwordLoginHandler,
  confirmPasswordResetHandler,
  requestPasswordResetHandler,
  reviewAccountRequestHandler
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/google", asyncHandler(googleLoginHandler));
authRouter.get("/google/redirect", (_req, res) => {
  res.redirect(303, "/login");
});
authRouter.post("/google/redirect", asyncHandler(googleRedirectLoginHandler));
authRouter.post("/login", asyncHandler(passwordLoginHandler));
authRouter.post("/password-reset/request", asyncHandler(requestPasswordResetHandler));
authRouter.post("/password-reset/confirm", asyncHandler(confirmPasswordResetHandler));
authRouter.get("/account-requests", authenticate, requireRoles("Admin"), asyncHandler(listAccountRequestsHandler));
authRouter.patch("/account-requests/:id/status", authenticate, requireRoles("Admin"), asyncHandler(reviewAccountRequestHandler));
authRouter.get("/me", asyncHandler(meHandler));
