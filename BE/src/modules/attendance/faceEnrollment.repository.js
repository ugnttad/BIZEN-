import { query } from "../../config/db.js";

const enrollmentSelect = `
  SELECT
    fe.id::text,
    fe.company_id AS "companyId",
    fe.employee_id AS "employeeId",
    e.name AS "employeeName",
    d.name AS department,
    fe.image_storage_key AS "imageStorageKey",
    fe.image_mime_type AS "imageMimeType",
    fe.face_confidence::float AS "faceConfidence",
    fe.status,
    fe.rekognition_face_id AS "rekognitionFaceId",
    fe.rekognition_collection_id AS "rekognitionCollectionId",
    fe.rejection_reason AS "rejectionReason",
    fe.reviewed_by AS "reviewedBy",
    fe.requested_at AS "requestedAt",
    fe.reviewed_at AS "reviewedAt",
    fe.updated_at AS "updatedAt"
  FROM face_enrollments fe
  JOIN employees e ON e.id = fe.employee_id
  LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
`;

function withImageUrl(row) {
  if (!row) return row;
  return {
    ...row,
    imageUrl: `/attendance/face-enrollments/${row.id}/image`
  };
}

export async function createPendingFaceEnrollment(companyId, employeeId, data) {
  await query(
    `UPDATE face_enrollments
     SET status = 'Revoked', updated_at = now()
     WHERE employee_id = $1 AND company_id = $2 AND status = 'Pending'`,
    [employeeId, companyId]
  );

  const result = await query(
    `INSERT INTO face_enrollments
      (company_id, employee_id, image_storage_key, image_mime_type, face_confidence, status)
     VALUES ($1, $2, $3, $4, $5, 'Pending')
     RETURNING id::text`,
    [companyId, employeeId, data.imageStorageKey, data.imageMimeType, data.faceConfidence]
  );

  return getFaceEnrollmentById(result.rows[0].id);
}

export async function listFaceEnrollments({ status = "All", companyId } = {}) {
  const values = [companyId];
  let where = "WHERE fe.company_id = $1";

  if (status !== "All") {
    values.push(status);
    where += " AND fe.status = $2";
  }

  const result = await query(`${enrollmentSelect} ${where} ORDER BY fe.requested_at DESC`, values);
  return result.rows.map(withImageUrl);
}

export async function getFaceEnrollmentById(id, companyId = null) {
  const result = await query(`${enrollmentSelect} WHERE fe.id = $1 AND ($2::uuid IS NULL OR fe.company_id = $2)`, [id, companyId]);
  return withImageUrl(result.rows[0]);
}

export async function getLatestFaceEnrollment(employeeId, companyId = null) {
  const result = await query(`${enrollmentSelect} WHERE fe.employee_id = $1 AND ($2::uuid IS NULL OR fe.company_id = $2) ORDER BY fe.requested_at DESC LIMIT 1`, [employeeId, companyId]);
  return withImageUrl(result.rows[0]);
}

export async function getApprovedFaceEnrollment(employeeId) {
  const result = await query(
    `${enrollmentSelect}
     WHERE fe.employee_id = $1 AND fe.status = 'Approved'
     ORDER BY fe.reviewed_at DESC NULLS LAST, fe.requested_at DESC
     LIMIT 1`,
    [employeeId]
  );
  return withImageUrl(result.rows[0]);
}

export async function approveFaceEnrollment(id, data) {
  const existing = await getFaceEnrollmentById(id);
  if (!existing) return null;

  await query(
    `UPDATE face_enrollments
     SET status = 'Revoked', updated_at = now()
     WHERE employee_id = $1 AND company_id = $3 AND status = 'Approved' AND id <> $2`,
    [existing.employeeId, id, existing.companyId]
  );

  const result = await query(
    `UPDATE face_enrollments SET
      status = 'Approved',
      rekognition_face_id = $2,
      rekognition_collection_id = $3,
      face_confidence = COALESCE($4, face_confidence),
      reviewed_by = $5,
      reviewed_at = now(),
      updated_at = now(),
      rejection_reason = NULL
     WHERE id = $1
     RETURNING id::text`,
    [id, data.faceId, data.collectionId, data.faceConfidence, data.reviewedBy || "HR"]
  );

  return result.rows[0] ? getFaceEnrollmentById(result.rows[0].id) : null;
}

export async function rejectFaceEnrollment(id, data) {
  const result = await query(
    `UPDATE face_enrollments SET
      status = 'Rejected',
      rejection_reason = $2,
      reviewed_by = $3,
      reviewed_at = now(),
      updated_at = now()
     WHERE id = $1
     RETURNING id::text`,
    [id, data.rejectionReason || "Rejected by HR", data.reviewedBy || "HR"]
  );

  return result.rows[0] ? getFaceEnrollmentById(result.rows[0].id) : null;
}
