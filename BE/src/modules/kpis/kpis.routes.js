import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../../config/db.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getBusinessDate } from "../../shared/businessDate.js";
import { httpError } from "../../shared/httpError.js";
import { isIsoDate, isTime } from "../../shared/validation.js";
import { requireRoles } from "../auth/auth.middleware.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const kpisRouter = Router();

const statusValues = ["All", "Pending", "InProgress", "Submitted", "Approved", "Rejected", "Late", "Missed"];
const reviewStatusValues = ["Approved", "Rejected"];
const progressStatusValues = ["Pending", "InProgress"];

const taskFiltersSchema = z.object({
  date: z.string().refine(isIsoDate, "Ngày checklist chưa hợp lệ").optional(),
  status: z.enum(statusValues).optional().default("All"),
  employeeId: z.string().trim().min(1).optional()
});

const createTaskSchema = z.object({
  employeeId: z.string().trim().min(1),
  workDate: z.string().refine(isIsoDate, "Ngày làm chưa hợp lệ").default(() => getBusinessDate()),
  shiftId: z.string().trim().min(1).optional().or(z.literal("")),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional().default(""),
  dueTime: z.string().refine(isTime, "Giờ deadline chưa hợp lệ"),
  requiresPhoto: z.coerce.boolean().default(true),
  minPhotoCount: z.coerce.number().int().min(0).max(3).default(1)
});

const submitTaskSchema = z.object({
  note: z.string().trim().max(500).optional().default(""),
  images: z.array(z.string().min(200)).max(3).optional().default([])
});

const reviewTaskSchema = z.object({
  status: z.enum(reviewStatusValues),
  rejectionReason: z.string().trim().max(300).optional().default("")
});

const progressTaskSchema = z.object({
  status: z.enum(progressStatusValues)
});

const imageDataUrlPattern = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i;

let kpiSchemaReady = false;

async function ensureKpiSchema(executor = query) {
  if (kpiSchemaReady) return;

  const sql = `
    CREATE TABLE IF NOT EXISTS kpi_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL,
      default_due_offset_minutes INTEGER NOT NULL DEFAULT 60,
      requires_photo BOOLEAN NOT NULL DEFAULT true,
      min_photo_count INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS shift_kpi_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
      work_date DATE NOT NULL,
      shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL,
      template_id UUID REFERENCES kpi_templates(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_at TIMESTAMPTZ NOT NULL,
      requires_photo BOOLEAN NOT NULL DEFAULT true,
      min_photo_count INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'InProgress', 'Submitted', 'Approved', 'Rejected')),
      employee_note TEXT,
      rejection_reason TEXT,
      submitted_at TIMESTAMPTZ,
      reviewed_at TIMESTAMPTZ,
      reviewed_by TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS shift_kpi_task_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID REFERENCES shift_kpi_tasks(id) ON DELETE CASCADE,
      image_data BYTEA NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_shift_kpi_tasks_company_date ON shift_kpi_tasks(company_id, work_date DESC);
    CREATE INDEX IF NOT EXISTS idx_shift_kpi_tasks_employee_date ON shift_kpi_tasks(employee_id, work_date DESC);
    CREATE INDEX IF NOT EXISTS idx_shift_kpi_tasks_status ON shift_kpi_tasks(company_id, status);
    CREATE INDEX IF NOT EXISTS idx_shift_kpi_task_photos_task ON shift_kpi_task_photos(task_id);
  `;

  if (typeof executor === "function") {
    await executor(sql);
  } else {
    await executor.query(sql);
  }

  kpiSchemaReady = true;
}

function businessDueDate(workDate, dueTime) {
  const date = new Date(`${workDate}T${dueTime}:00+07:00`);
  if (Number.isNaN(date.getTime())) {
    throw httpError(400, "Deadline checklist chưa hợp lệ.");
  }
  return date;
}

function decodeKpiImage(image) {
  const match = imageDataUrlPattern.exec(image || "");
  if (!match) {
    throw httpError(400, "Ảnh minh chứng cần là JPEG, PNG hoặc WebP dạng data URL.");
  }

  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");

  if (buffer.length < 512) {
    throw httpError(400, "Ảnh minh chứng quá nhỏ.");
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw httpError(413, "Ảnh minh chứng tối đa 5MB.");
  }

  return { buffer, mimeType, size: buffer.length };
}

function timelinessExpression() {
  return `
    CASE
      WHEN t.status IN ('Submitted', 'Approved', 'Rejected') AND t.submitted_at IS NOT NULL AND t.submitted_at <= t.due_at THEN 'OnTime'
      WHEN t.status IN ('Submitted', 'Approved', 'Rejected') AND t.submitted_at IS NOT NULL AND t.submitted_at > t.due_at THEN 'Late'
      WHEN t.status IN ('Pending', 'InProgress') AND now() > t.due_at THEN 'Missed'
      ELSE 'Open'
    END
  `;
}

function taskSelect() {
  return `
    t.id,
    t.employee_id AS "employeeId",
    e.name AS "employeeName",
    d.name AS department,
    e.position,
    to_char(t.work_date, 'YYYY-MM-DD') AS "workDate",
    t.shift_id AS "shiftId",
    sh.name AS "shiftName",
    sh.time_range AS "shiftTime",
    t.title,
    t.description,
    t.due_at AS "dueAt",
    to_char(t.due_at AT TIME ZONE $2, 'HH24:MI') AS "dueTime",
    t.requires_photo AS "requiresPhoto",
    t.min_photo_count AS "minPhotoCount",
    t.status,
    ${timelinessExpression()} AS timeliness,
    t.employee_note AS "employeeNote",
    t.rejection_reason AS "rejectionReason",
    t.submitted_at AS "submittedAt",
    t.reviewed_at AS "reviewedAt",
    t.reviewed_by AS "reviewedBy",
    t.created_by AS "createdBy",
    t.created_at AS "createdAt",
    COALESCE(photo_stats.photo_count, 0)::int AS "photoCount",
    photo_stats.first_photo_id AS "firstPhotoId"
  `;
}

function taskJoins() {
  return `
    JOIN employees e ON e.id = t.employee_id AND e.company_id = t.company_id
    LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
    LEFT JOIN shifts sh ON sh.id = t.shift_id AND sh.company_id = t.company_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS photo_count, MIN(id::text) AS first_photo_id
      FROM shift_kpi_task_photos
      WHERE task_id = t.id
    ) photo_stats ON true
  `;
}

async function listTasks(companyId, filters, user) {
  await ensureKpiSchema();

  const params = [companyId, env.businessTimeZone, filters.date || getBusinessDate()];
  const conditions = ["t.company_id = $1", "t.work_date = $3::date"];

  if (user.role === "Employee") {
    params.push(user.employeeId);
    conditions.push(`t.employee_id = $${params.length}`);
  } else if (filters.employeeId) {
    params.push(filters.employeeId);
    conditions.push(`t.employee_id = $${params.length}`);
  }

  if (filters.status && filters.status !== "All") {
    if (filters.status === "Late") {
      conditions.push("t.status IN ('Submitted', 'Approved', 'Rejected') AND t.submitted_at > t.due_at");
    } else if (filters.status === "Missed") {
      conditions.push("t.status IN ('Pending', 'InProgress') AND now() > t.due_at");
    } else {
      params.push(filters.status);
      conditions.push(`t.status = $${params.length}`);
    }
  }

  const result = await query(
    `SELECT ${taskSelect()}
     FROM shift_kpi_tasks t
     ${taskJoins()}
     WHERE ${conditions.join(" AND ")}
     ORDER BY t.due_at ASC, e.name ASC`,
    params
  );

  return result.rows;
}

async function getTask(companyId, id, user, executor = query) {
  await ensureKpiSchema(executor);

  const params = [companyId, env.businessTimeZone, id];
  const employeeFilter = user.role === "Employee" ? "AND t.employee_id = $4" : "";
  if (user.role === "Employee") params.push(user.employeeId);

  const result = await executor(
    `SELECT ${taskSelect()}
     FROM shift_kpi_tasks t
     ${taskJoins()}
     WHERE t.company_id = $1
       AND t.id = $3
       ${employeeFilter}`,
    params
  );

  return result.rows[0];
}

async function assertEmployeeInCompany(companyId, employeeId, executor = query) {
  const result = await executor("SELECT id FROM employees WHERE company_id = $1 AND id = $2", [companyId, employeeId]);
  if (!result.rows[0]) {
    throw httpError(404, "Không tìm thấy nhân viên trong doanh nghiệp này.");
  }
}

async function assertShiftInCompany(companyId, shiftId, executor = query) {
  if (!shiftId) return;
  const result = await executor("SELECT id FROM shifts WHERE company_id = $1 AND id = $2", [companyId, shiftId]);
  if (!result.rows[0]) {
    throw httpError(404, "Không tìm thấy ca làm trong doanh nghiệp này.");
  }
}

kpisRouter.get(
  "/tasks",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const filters = taskFiltersSchema.parse(req.query);
    res.json(await listTasks(companyId, filters, req.user));
  })
);

kpisRouter.post(
  "/tasks",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const data = createTaskSchema.parse(req.body);
    const shiftId = data.shiftId || null;

    await withTransaction(async (client) => {
      await ensureKpiSchema(client);
      await assertEmployeeInCompany(companyId, data.employeeId, client.query.bind(client));
      await assertShiftInCompany(companyId, shiftId, client.query.bind(client));

      await client.query(
        `INSERT INTO shift_kpi_tasks (
          company_id,
          employee_id,
          work_date,
          shift_id,
          title,
          description,
          due_at,
          requires_photo,
          min_photo_count,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          companyId,
          data.employeeId,
          data.workDate,
          shiftId,
          data.title,
          data.description,
          businessDueDate(data.workDate, data.dueTime),
          data.requiresPhoto,
          data.requiresPhoto ? Math.max(1, data.minPhotoCount) : 0,
          req.user.name || req.user.email
        ]
      );
    });

    const tasks = await listTasks(companyId, { date: data.workDate, status: "All" }, req.user);
    res.status(201).json(tasks);
  })
);

kpisRouter.patch(
  "/tasks/:id/progress",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const data = progressTaskSchema.parse(req.body);
    const current = await getTask(companyId, req.params.id, req.user);
    if (!current) throw httpError(404, "Không tìm thấy việc cần làm.");
    if (["Submitted", "Approved"].includes(current.status)) {
      throw httpError(409, "Việc này đã nộp hoặc đã duyệt, không thể đổi tiến độ.");
    }

    await query(
      `UPDATE shift_kpi_tasks
       SET status = $1, updated_at = now()
       WHERE id = $2 AND company_id = $3`,
      [data.status, req.params.id, companyId]
    );

    res.json(await getTask(companyId, req.params.id, req.user));
  })
);

kpisRouter.post(
  "/tasks/:id/submit",
  requireRoles("Employee"),
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const data = submitTaskSchema.parse(req.body);
    const current = await getTask(companyId, req.params.id, req.user);
    if (!current) throw httpError(404, "Không tìm thấy việc cần làm của bạn.");
    if (current.status === "Approved") {
      throw httpError(409, "Việc này đã được chủ quán duyệt.");
    }
    if (current.requiresPhoto && data.images.length < current.minPhotoCount) {
      throw httpError(400, `Việc này cần tối thiểu ${current.minPhotoCount} ảnh minh chứng.`);
    }

    const images = data.images.map(decodeKpiImage);

    await withTransaction(async (client) => {
      await ensureKpiSchema(client);
      await client.query(
        `UPDATE shift_kpi_tasks
         SET status = 'Submitted',
             employee_note = $1,
             rejection_reason = NULL,
             reviewed_at = NULL,
             reviewed_by = NULL,
             submitted_at = now(),
             updated_at = now()
         WHERE id = $2 AND company_id = $3 AND employee_id = $4`,
        [data.note, req.params.id, companyId, req.user.employeeId]
      );

      await client.query("DELETE FROM shift_kpi_task_photos WHERE task_id = $1", [req.params.id]);

      for (const image of images) {
        await client.query(
          `INSERT INTO shift_kpi_task_photos (id, task_id, image_data, mime_type, size_bytes)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), req.params.id, image.buffer, image.mimeType, image.size]
        );
      }
    });

    res.json(await getTask(companyId, req.params.id, req.user));
  })
);

kpisRouter.patch(
  "/tasks/:id/review",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const data = reviewTaskSchema.parse(req.body);
    const current = await getTask(companyId, req.params.id, req.user);
    if (!current) throw httpError(404, "Không tìm thấy việc cần làm.");
    if (current.status !== "Submitted") {
      throw httpError(409, "Chỉ việc đã nộp mới có thể duyệt.");
    }
    if (data.status === "Rejected" && !data.rejectionReason) {
      throw httpError(400, "Nhập lý do nếu yêu cầu nhân viên làm lại.");
    }

    await query(
      `UPDATE shift_kpi_tasks
       SET status = $1,
           rejection_reason = $2,
           reviewed_at = now(),
           reviewed_by = $3,
           updated_at = now()
       WHERE id = $4 AND company_id = $5`,
      [data.status, data.status === "Rejected" ? data.rejectionReason : null, req.user.name || req.user.email, req.params.id, companyId]
    );

    res.json(await getTask(companyId, req.params.id, req.user));
  })
);

kpisRouter.delete(
  "/tasks/:id",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    await ensureKpiSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query("DELETE FROM shift_kpi_tasks WHERE id = $1 AND company_id = $2 RETURNING id", [req.params.id, companyId]);
    if (!result.rows[0]) throw httpError(404, "Không tìm thấy việc cần làm.");
    res.status(204).end();
  })
);

kpisRouter.get(
  "/task-photos/:id/image",
  asyncHandler(async (req, res) => {
    await ensureKpiSchema();
    const companyId = await getCompanyIdForUser(req.user);
    const params = req.user.role === "Employee" ? [req.params.id, companyId, req.user.employeeId] : [req.params.id, companyId];
    const employeeFilter = req.user.role === "Employee" ? "AND t.employee_id = $3" : "";
    const result = await query(
      `SELECT p.image_data, p.mime_type
       FROM shift_kpi_task_photos p
       JOIN shift_kpi_tasks t ON t.id = p.task_id
       WHERE p.id = $1
         AND t.company_id = $2
         ${employeeFilter}`,
      params
    );

    const image = result.rows[0];
    if (!image) throw httpError(404, "Không tìm thấy ảnh minh chứng.");

    res.setHeader("Content-Type", image.mime_type);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(image.image_data));
  })
);
