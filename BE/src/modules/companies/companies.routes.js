import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { getCompanyById, getCompanyIdForUser } from "./company.repository.js";

export const companiesRouter = Router();

companiesRouter.get(
  "/current",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const company = await getCompanyById(companyId);
    if (!company) throw httpError(404, "Company not found");
    res.json(company);
  })
);
