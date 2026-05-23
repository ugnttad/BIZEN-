import { z } from "zod";
import { httpError } from "../../shared/httpError.js";
import { hashPassword } from "../auth/password.service.js";
import { createCompanyAccessRequest, listCompanyAccessRequests, reviewCompanyAccessRequest } from "./tenants.repository.js";

const companyAccessRequestSchema = z.object({
  companyName: z.string().min(2),
  city: z.string().min(2).default("Da Nang"),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must have at least 8 characters")
});

const reviewCompanyRequestSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  rejectionReason: z.string().optional()
});

export async function createCompanyAccessRequestHandler(req, res) {
  const data = companyAccessRequestSchema.parse(req.body);
  const request = await createCompanyAccessRequest({
    companyName: data.companyName,
    city: data.city,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    phone: data.phone,
    adminPasswordHash: hashPassword(data.password)
  });

  res.status(201).json(request);
}

export async function listCompanyAccessRequestsHandler(req, res) {
  const status = req.query.status || "Pending";
  res.json(await listCompanyAccessRequests(status));
}

export async function reviewCompanyAccessRequestHandler(req, res) {
  const data = reviewCompanyRequestSchema.parse(req.body);
  const reviewed = await reviewCompanyAccessRequest(req.params.id, {
    status: data.status,
    reviewedBy: req.user?.name || req.user?.email || "Platform Admin",
    rejectionReason: data.rejectionReason
  });

  if (!reviewed) throw httpError(404, "Company request not found");
  res.json(reviewed);
}
