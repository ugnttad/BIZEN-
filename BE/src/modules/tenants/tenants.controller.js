import { z } from "zod";
import { httpError } from "../../shared/httpError.js";
import { isStrongPassword, isVietnamPhone, normalizeEmail, normalizePhone } from "../../shared/validation.js";
import { hashPassword } from "../auth/password.service.js";
import { buildCompanyApprovedEmail, sendMail } from "../mail/mail.service.js";
import { createCompanyAccessRequest, findCompanyAccessConflict, listCompanyAccessRequests, reviewCompanyAccessRequest } from "./tenants.repository.js";

const companyAccessRequestSchema = z.object({
  companyName: z.string().trim().min(2, "Tên doanh nghiệp cần ít nhất 2 ký tự").max(80, "Tên doanh nghiệp tối đa 80 ký tự"),
  city: z.string().trim().min(2).default("Đà Nẵng"),
  contactName: z.string().trim().min(2, "Tên người đại diện cần ít nhất 2 ký tự").max(80, "Tên người đại diện tối đa 80 ký tự"),
  contactEmail: z.string().trim().email("Email admin chưa hợp lệ").transform(normalizeEmail),
  phone: z.string().optional().transform((value) => normalizePhone(value || "")),
  password: z.string().refine(isStrongPassword, "Mật khẩu cần ít nhất 8 ký tự, có chữ và số")
});

const reviewCompanyRequestSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  rejectionReason: z.string().optional()
});

export async function createCompanyAccessRequestHandler(req, res) {
  const data = companyAccessRequestSchema.parse(req.body);
  if (!["đà nẵng", "da nang"].includes(data.city.toLowerCase())) {
    throw httpError(400, "BIZEN MVP hiện chỉ nhận đăng ký cửa hàng tại Đà Nẵng");
  }
  if (data.phone && !isVietnamPhone(data.phone)) {
    throw httpError(400, "Số điện thoại cần 9-11 chữ số, phù hợp số điện thoại Việt Nam");
  }

  const conflict = await findCompanyAccessConflict(data);
  if (conflict) throw httpError(409, conflict);

  const request = await createCompanyAccessRequest({
    companyName: data.companyName,
    city: "Đà Nẵng",
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
