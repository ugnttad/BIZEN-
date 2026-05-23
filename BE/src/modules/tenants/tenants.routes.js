import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { authenticate, requireRoles } from "../auth/auth.middleware.js";
import {
  createCompanyAccessRequestHandler,
  listCompanyAccessRequestsHandler,
  reviewCompanyAccessRequestHandler
} from "./tenants.controller.js";

export const tenantsRouter = Router();

tenantsRouter.post("/company-requests", asyncHandler(createCompanyAccessRequestHandler));
tenantsRouter.get("/company-requests", authenticate, requireRoles("PlatformAdmin"), asyncHandler(listCompanyAccessRequestsHandler));
tenantsRouter.patch("/company-requests/:id/status", authenticate, requireRoles("PlatformAdmin"), asyncHandler(reviewCompanyAccessRequestHandler));
