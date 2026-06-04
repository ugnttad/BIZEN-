import { z } from "zod";
import { httpError } from "../../shared/httpError.js";
import { getEmployeeAttendanceContext } from "./attendance.repository.js";
import {
  approveFaceEnrollment,
  createPendingFaceEnrollment,
  getApprovedFaceEnrollmentForEmployee,
  getFaceEnrollmentById,
  getLatestFaceEnrollment,
  listFaceEnrollments,
  rejectFaceEnrollment
} from "./faceEnrollment.repository.js";
import { readFaceEnrollmentImage, storeFaceEnrollmentImage } from "./faceEnrollment.storage.js";
import { findDuplicateEnrollmentFaces, indexEmployeeFaceBuffer, validateFaceImage } from "./faceVerification.service.js";

const faceEnrollSchema = z.object({
  employeeId: z.string().min(1),
  image: z.string().min(200)
});

const listSchema = z.object({
  status: z.enum(["All", "Pending", "Approved", "Rejected", "Revoked"]).optional()
});

const reviewSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  reviewedBy: z.string().trim().max(120).optional(),
  rejectionReason: z.string().trim().max(500).optional()
});

export async function faceEnrollHandler(req, res) {
  const payload = faceEnrollSchema.parse(req.body);
  if (req.user.role === "Employee" && payload.employeeId !== req.user.employeeId) {
    throw httpError(403, "Employees can only enroll their own face");
  }

  const context = await getEmployeeAttendanceContext(payload.employeeId);
  if (!context) {
    throw httpError(404, "Employee not found");
  }
  if (req.user.companyId && context.companyId !== req.user.companyId) {
    throw httpError(403, "Employee belongs to another company");
  }

  const face = await validateFaceImage(payload.image);
  if (!face.valid) {
    throw httpError(422, face.reason || "Face image is not valid");
  }

  const stored = await storeFaceEnrollmentImage(payload.image);
  const enrollment = await createPendingFaceEnrollment(context.companyId, payload.employeeId, {
    imageStorageKey: stored.key,
    imageMimeType: stored.mimeType,
    faceConfidence: face.confidence
  });

  res.status(201).json({
    pending: true,
    enrolled: false,
    status: enrollment.status,
    employeeId: payload.employeeId,
    employeeName: context.employeeName,
    enrollmentId: enrollment.id,
    requestedAt: enrollment.requestedAt,
    imageUrl: enrollment.imageUrl,
    face: {
      confidence: face.confidence,
      faceCount: face.faceCount
    }
  });
}

export async function listFaceEnrollmentsHandler(req, res) {
  const query = listSchema.parse({ status: req.query.status || "All" });
  res.json(await listFaceEnrollments({ status: query.status || "All", companyId: req.user.companyId }));
}

export async function latestFaceEnrollmentHandler(req, res) {
  if (req.user.role === "Employee" && req.params.employeeId !== req.user.employeeId) {
    throw httpError(403, "Employees can only access their own Face ID status");
  }

  const enrollment = await getLatestFaceEnrollment(req.params.employeeId, req.user.companyId);
  if (!enrollment) {
    res.json({ status: "Not submitted" });
    return;
  }

  res.json(enrollment);
}

export async function faceEnrollmentImageHandler(req, res) {
  const enrollment = await getFaceEnrollmentById(req.params.id, req.user.companyId);
  if (!enrollment) {
    throw httpError(404, "Face enrollment not found");
  }

  const image = await readFaceEnrollmentImage(enrollment.imageStorageKey);
  res.setHeader("Content-Type", enrollment.imageMimeType);
  res.setHeader("Cache-Control", "private, max-age=60");
  res.send(image);
}

export async function reviewFaceEnrollmentHandler(req, res) {
  const payload = reviewSchema.parse(req.body);
  const enrollment = await getFaceEnrollmentById(req.params.id, req.user.companyId);
  if (!enrollment) {
    throw httpError(404, "Face enrollment not found");
  }
  if (enrollment.status !== "Pending") {
    throw httpError(409, `Face enrollment is already ${enrollment.status}`);
  }

  if (payload.status === "Rejected") {
    res.json(
      await rejectFaceEnrollment(enrollment.id, {
        ...payload,
        reviewedBy: payload.reviewedBy || req.user.name
      })
    );
    return;
  }

  const image = await readFaceEnrollmentImage(enrollment.imageStorageKey);
  const duplicateSearch = await findDuplicateEnrollmentFaces(image);
  if (!duplicateSearch.ready && duplicateSearch.mode === "aws-required") {
    throw httpError(502, duplicateSearch.reason || "AWS Rekognition chưa sẵn sàng để kiểm tra trùng khuôn mặt.");
  }

  for (const match of duplicateSearch.matches || []) {
    if (!match.employeeId || match.employeeId === enrollment.employeeId) continue;

    const duplicateOwner = await getApprovedFaceEnrollmentForEmployee(enrollment.companyId, match.employeeId);
    if (!duplicateOwner) continue;

    throw httpError(
      409,
      `Khuôn mặt này đã được duyệt cho ${duplicateOwner.employeeName} (${duplicateOwner.employeeId}) với độ giống ${Math.round(match.similarity)}%. Không thể dùng cùng một khuôn mặt cho 2 tài khoản.`
    );
  }

  const indexed = await indexEmployeeFaceBuffer(enrollment.employeeId, image);
  if (!indexed.enrolled) {
    throw httpError(422, indexed.reason || "AWS Rekognition could not index this face");
  }

  const approved = await approveFaceEnrollment(enrollment.id, {
    faceId: indexed.faceId,
    collectionId: indexed.collectionId,
    faceConfidence: indexed.confidence,
    reviewedBy: payload.reviewedBy || req.user.name
  });

  res.json(approved);
}
