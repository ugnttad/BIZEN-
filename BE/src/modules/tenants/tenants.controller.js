import { z } from "zod";
import { httpError } from "../../shared/httpError.js";
import { isStrongPassword, isVietnamPhone, normalizeEmail, normalizePhone } from "../../shared/validation.js";
import { hashPassword } from "../auth/password.service.js";
import { buildCompanyApprovedEmail, sendMail } from "../mail/mail.service.js";
import { createCompanyAccessRequest, findCompanyAccessConflict, listCompanyAccessRequests, reviewCompanyAccessRequest } from "./tenants.repository.js";

function normalizeTaxCode(value = "") {
  return String(value).replace(/\D/g, "");
}

const companyAccessRequestSchema = z.object({
  companyName: z.string().trim().min(2, "Ten doanh nghiep can it nhat 2 ky tu").max(80, "Ten doanh nghiep toi da 80 ky tu"),
  city: z.string().trim().min(2).default("Da Nang"),
  businessType: z.string().trim().min(2).max(80).default("Cafe / Milk tea"),
  businessAddress: z.string().trim().min(5, "Dia chi kinh doanh la bat buoc").max(180),
  taxCode: z.string().transform(normalizeTaxCode).refine((value) => value.length === 10 || value.length === 13, "Ma so thue can 10 hoac 13 chu so"),
  website: z.string().trim().max(160).optional().default(""),
  verificationNote: z.string().trim().max(300).optional().default(""),
  contactName: z.string().trim().min(2, "Ten nguoi dai dien can it nhat 2 ky tu").max(80, "Ten nguoi dai dien toi da 80 ky tu"),
  contactEmail: z.string().trim().email("Email admin chua hop le").transform(normalizeEmail),
  phone: z.string().optional().transform((value) => normalizePhone(value || "")),
  employeeCount: z.coerce.number().int().min(1, "Quy mo nhan su toi thieu 1 nguoi").max(20, "BIZEN MVP ho tro toi da 20 nhan su").default(10),
  password: z.string().refine(isStrongPassword, "Mat khau can it nhat 8 ky tu, co chu va so")
});

const reviewCompanyRequestSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  rejectionReason: z.string().optional()
});

export async function createCompanyAccessRequestHandler(req, res) {
  const data = companyAccessRequestSchema.parse(req.body);
  if (!["da nang", "danang", "đà nẵng"].includes(data.city.toLowerCase())) {
    throw httpError(400, "BIZEN MVP hien chi nhan dang ky cua hang tai Da Nang");
  }
  if (data.phone && !isVietnamPhone(data.phone)) {
    throw httpError(400, "So dien thoai can 9-11 chu so, phu hop so dien thoai Viet Nam");
  }

  const conflict = await findCompanyAccessConflict(data);
  if (conflict) throw httpError(409, conflict);

  const request = await createCompanyAccessRequest({
    companyName: data.companyName,
    city: "Da Nang",
    businessType: data.businessType,
    businessAddress: data.businessAddress,
    taxCode: data.taxCode,
    website: data.website,
    verificationNote: data.verificationNote,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    phone: data.phone,
    employeeCount: data.employeeCount,
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
  if (reviewed.status === "Approved") {
    await sendMail({
      to: reviewed.contactEmail,
      ...buildCompanyApprovedEmail({
        ownerName: reviewed.contactName,
        companyName: reviewed.companyName
      })
    });
  }
  res.json(reviewed);
}
