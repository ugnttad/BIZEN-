import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { query, withTransaction } from "../../config/db.js";
import { httpError } from "../../shared/httpError.js";
import { isTime } from "../../shared/validation.js";
import { requireRoles } from "../auth/auth.middleware.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";
import { z } from "zod";

export const shiftsRouter = Router();

const shiftSchema = z.object({
  name: z.string().trim().min(2).max(80),
  startTime: z.string().refine(isTime, "Gio bat dau ca chua hop le"),
  endTime: z.string().refine(isTime, "Gio ket thuc ca chua hop le"),
  required: z.coerce.number().int().min(1).max(50),
  color: z.enum(["blue", "violet", "indigo", "cyan"]).default("blue")
});

function normalizeShift(data) {
  if (data.startTime === data.endTime) {
    throw httpError(400, "Gio bat dau va gio ket thuc ca khong duoc trung nhau.");
  }

  return {
    name: data.name,
    timeRange: `${data.startTime} - ${data.endTime}`,
    shortTime: data.startTime,
    required: data.required,
    color: data.color
  };
}

function makeShiftId(companyId, name) {
  const slug = String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return `${String(companyId).slice(0, 8)}-${slug || "shift"}-${Date.now().toString(36)}`;
}

shiftsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const result = await query(
      `SELECT id, name, time_range AS time, short_time AS "shortTime", required_count AS required, color FROM shifts WHERE company_id = $1 ORDER BY short_time`,
      [companyId]
    );
    res.json(result.rows);
  })
);

shiftsRouter.post(
  "/",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const data = normalizeShift(shiftSchema.parse(req.body));
    const id = makeShiftId(companyId, data.name);

    const result = await query(
      `INSERT INTO shifts (id, company_id, name, time_range, short_time, required_count, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, time_range AS time, short_time AS "shortTime", required_count AS required, color`,
      [id, companyId, data.name, data.timeRange, data.shortTime, data.required, data.color]
    );

    res.status(201).json(result.rows[0]);
  })
);

shiftsRouter.patch(
  "/:id",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const data = normalizeShift(shiftSchema.parse(req.body));

    const result = await query(
      `UPDATE shifts
       SET name = $3, time_range = $4, short_time = $5, required_count = $6, color = $7
       WHERE id = $1 AND company_id = $2
       RETURNING id, name, time_range AS time, short_time AS "shortTime", required_count AS required, color`,
      [req.params.id, companyId, data.name, data.timeRange, data.shortTime, data.required, data.color]
    );

    if (!result.rows[0]) {
      throw httpError(404, "Khong tim thay ca lam trong doanh nghiep nay.");
    }

    res.json(result.rows[0]);
  })
);

shiftsRouter.delete(
  "/:id",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);

    await withTransaction(async (client) => {
      const usage = await client.query(
        `SELECT
          (SELECT COUNT(*)::int FROM employees WHERE company_id = $1 AND shift_id = $2) AS employee_count,
          (SELECT COUNT(*)::int
             FROM schedule_slots ss
             JOIN schedule_days sd ON sd.id = ss.schedule_day_id
            WHERE sd.company_id = $1 AND ss.shift_id = $2) AS schedule_count`,
        [companyId, req.params.id]
      );

      const counts = usage.rows[0] || {};
      if (Number(counts.employee_count || 0) > 0 || Number(counts.schedule_count || 0) > 0) {
        throw httpError(409, "Ca nay dang duoc gan cho nhan vien hoac lich tuan. Hay go khoi lich/nhan vien truoc khi xoa.");
      }

      const deleted = await client.query("DELETE FROM shifts WHERE id = $1 AND company_id = $2 RETURNING id", [req.params.id, companyId]);
      if (!deleted.rows[0]) {
        throw httpError(404, "Khong tim thay ca lam trong doanh nghiep nay.");
      }
    });

    res.status(204).end();
  })
);
