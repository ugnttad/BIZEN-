import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { googleLoginHandler, meHandler } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/google", asyncHandler(googleLoginHandler));
authRouter.get("/me", asyncHandler(meHandler));
