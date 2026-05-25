import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
import { isIsoDate } from "../../shared/validation.js";
import { requireRoles } from "../auth/auth.middleware.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const schedulesRouter = Router();

const updateScheduleSchema = z.object({
  days: z
    .array(
      z.object({
        workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        day: z.string().trim().min(1).max(40),
        date: z.string().trim().min(1).max(20),
        shifts: z
          .array(
            z.object({
              shiftId: z.string().trim().min(1),
              employees: z.array(z.string().trim().min(1)).default([])
            })
          )
          .default([])
      })
    )
    .min(1)
    .max(14)
});

const availabilitySchema = z.object({
  employeeId: z.string().trim().min(1).optional(),
  busyDate: z.string().refine(isIsoDate, "Ngày bận chưa hợp lệ"),
  reason: z.string().trim().max(200).optional().default("")
});

const availabilityQuerySchema = z.object({
  employeeId: z.string().trim().min(1).optional()
});

let availabilitySchemaReady = false;

async function ensureAvailabilitySchema(executor = query) {
  if (availabilitySchemaReady) return;

  const sql = `
    CREATE TABLE IF NOT EXISTS employee_unavailability (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
      busy_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (company_id, employee_id, busy_date)
    );

    CREATE INDEX IF NOT EXISTS idx_employee_unavailability_company_date ON employee_unavailability(company_id, busy_date);
    CREATE INDEX IF NOT EXISTS idx_employee_unavailability_employee_date ON employee_unavailability(employee_id, busy_date);
  `;

  if (typeof executor === "function") {
    await executor(sql);
  } else {
    await executor.query(sql);
  }

  availabilitySchemaReady = true;
}

async function listWeekSchedule(companyId) {
  const result = await query(
    `SELECT
      sd.work_date,
      sd.label AS day,
      sd.display_date AS date,
      json_agg(
        json_build_object(
          'shiftId', ss.shift_id,
          'employees', ss.employee_ids
        )
        ORDER BY sh.short_time
      ) AS shifts
     FROM schedule_days sd
     JOIN schedule_slots ss ON ss.schedule_day_id = sd.id
     JOIN shifts sh ON sh.id = ss.shift_id
     WHERE sd.company_id = $1
     GROUP BY sd.id
     ORDER BY sd.work_date`,
    [companyId]
  );
  return result.rows;
}

async function listAvailability(companyId, employeeId) {
  await ensureAvailabilitySchema();

  const params = employeeId ? [companyId, employeeId] : [companyId];
  const employeeFilter = employeeId ? "AND eu.employee_id = $2" : "";
  const result = await query(
    `SELECT
      eu.id,
      eu.employee_id AS "employeeId",
      e.name AS "employeeName",
      d.name AS department,
      to_char(eu.busy_date, 'YYYY-MM-DD') AS "busyDate",
      to_char(eu.busy_date, 'DD/MM/YYYY') AS "displayDate",
      COALESCE(eu.reason, '') AS reason,
      eu.created_at AS "createdAt"
     FROM employee_unavailability eu
     JOIN employees e ON e.id = eu.employee_id AND e.company_id = eu.company_id
     LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id
     WHERE eu.company_id = $1 ${employeeFilter}
     ORDER BY eu.busy_date ASC, e.name ASC`,
    params
  );
  return result.rows;
}

function collectAssignments(days) {
  return days.flatMap((day) =>
    day.shifts.flatMap((slot) =>
      [...new Set(slot.employees)].map((employeeId) => ({
        employee_id: employeeId,
        work_date: day.workDate,
        display_date: day.date
      }))
    )
  );
}

schedulesRouter.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const filters = availabilityQuerySchema.parse(req.query);
    const employeeId = req.user.role === "Employee" ? req.user.employeeId : filters.employeeId;
    res.json(await listAvailability(companyId, employeeId));
  })
);

schedulesRouter.post(
  "/availability",
  asyncHandler(async (req, res) => {
    await ensureAvailabilitySchema();

    const data = availabilitySchema.parse(req.body);
    const companyId = await getCompanyIdForUser(req.user);
    const employeeId = data.employeeId || req.user.employeeId;

    if (!employeeId) {
      throw httpError(400, "Chọn nhân viên cần báo lịch bận.");
    }

    if (req.user.role === "Employee" && employeeId !== req.user.employeeId) {
      throw httpError(403, "Nhân viên chỉ được báo lịch bận cho chính mình.");
    }

    const employee = await query("SELECT id FROM employees WHERE id = $1 AND company_id = $2", [employeeId, companyId]);
    if (!employee.rows[0]) {
      throw httpError(404, "Không tìm thấy nhân viên trong doanh nghiệp này.");
    }

    const result = await query(
      `WITH upserted AS (
        INSERT INTO employee_unavailability (company_id, employee_id, busy_date, reason)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id, employee_id, busy_date)
        DO UPDATE SET reason = EXCLUDED.reason, created_at = now()
        RETURNING *
      )
      SELECT
        u.id,
        u.employee_id AS "employeeId",
        e.name AS "employeeName",
        d.name AS department,
        to_char(u.busy_date, 'YYYY-MM-DD') AS "busyDate",
        to_char(u.busy_date, 'DD/MM/YYYY') AS "displayDate",
        COALESCE(u.reason, '') AS reason,
        u.created_at AS "createdAt"
      FROM upserted u
      JOIN employees e ON e.id = u.employee_id AND e.company_id = u.company_id
      LEFT JOIN departments d ON d.id = e.department_id AND d.company_id = e.company_id`,
      [companyId, employeeId, data.busyDate, data.reason]
    );

    res.status(201).json(result.rows[0]);
  })
);

schedulesRouter.delete(
  "/availability/:id",
  asyncHandler(async (req, res) => {
    await ensureAvailabilitySchema();

    const companyId = await getCompanyIdForUser(req.user);
    const params = req.user.role === "Employee" ? [req.params.id, companyId, req.user.employeeId] : [req.params.id, companyId];
    const employeeFilter = req.user.role === "Employee" ? "AND employee_id = $3" : "";
    const result = await query(
      `DELETE FROM employee_unavailability
       WHERE id = $1 AND company_id = $2 ${employeeFilter}
       RETURNING id`,
      params
    );

    if (!result.rows[0]) {
      throw httpError(404, "Không tìm thấy lịch bận.");
    }

    res.status(204).end();
  })
);

schedulesRouter.get(
  "/week",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    res.json(await listWeekSchedule(companyId));
  })
);

schedulesRouter.put(
  "/week",
  requireRoles("Admin"),
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const payload = updateScheduleSchema.parse(req.body);
    const shiftIds = [...new Set(payload.days.flatMap((day) => day.shifts.map((slot) => slot.shiftId)))];
    const employeeIds = [...new Set(payload.days.flatMap((day) => day.shifts.flatMap((slot) => slot.employees)))];

    await withTransaction(async (client) => {
      await ensureAvailabilitySchema(client);

      if (shiftIds.length) {
        const shifts = await client.query("SELECT id FROM shifts WHERE company_id = $1 AND id = ANY($2::text[])", [companyId, shiftIds]);
        if (shifts.rows.length !== shiftIds.length) {
          throw httpError(400, "Lịch có ca làm không thuộc doanh nghiệp hiện tại.");
        }
      }

      if (employeeIds.length) {
        const employees = await client.query("SELECT id FROM employees WHERE company_id = $1 AND id = ANY($2::text[])", [companyId, employeeIds]);
        if (employees.rows.length !== employeeIds.length) {
          throw httpError(400, "Lịch có nhân viên không thuộc doanh nghiệp hiện tại.");
        }
      }

      const assignments = collectAssignments(payload.days);
      if (assignments.length) {
        const conflicts = await client.query(
          `WITH assignments AS (
            SELECT DISTINCT employee_id, work_date::date, display_date
            FROM jsonb_to_recordset($2::jsonb) AS x(employee_id text, work_date date, display_date text)
          )
          SELECT
            a.employee_id AS "employeeId",
            e.name AS "employeeName",
            COALESCE(a.display_date, to_char(a.work_date, 'DD/MM')) AS "displayDate",
            COALESCE(eu.reason, '') AS reason
          FROM assignments a
          JOIN employee_unavailability eu
            ON eu.company_id = $1
           AND eu.employee_id = a.employee_id
           AND eu.busy_date = a.work_date
          JOIN employees e ON e.id = a.employee_id AND e.company_id = $1
          ORDER BY a.work_date ASC, e.name ASC
          LIMIT 5`,
          [companyId, JSON.stringify(assignments)]
        );

        if (conflicts.rows[0]) {
          const conflict = conflicts.rows[0];
          const reason = conflict.reason ? ` (${conflict.reason})` : "";
          throw httpError(409, `${conflict.employeeName} đã báo bận ngày ${conflict.displayDate}${reason}. Gỡ nhân viên này khỏi ca rồi lưu lại.`);
        }
      }

      for (const day of payload.days) {
        const dayResult = await client.query(
          `INSERT INTO schedule_days (company_id, work_date, label, display_date)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (company_id, work_date)
           DO UPDATE SET label = EXCLUDED.label, display_date = EXCLUDED.display_date
           RETURNING id`,
          [companyId, day.workDate, day.day, day.date]
        );

        await client.query("DELETE FROM schedule_slots WHERE schedule_day_id = $1", [dayResult.rows[0].id]);

        for (const slot of day.shifts) {
          await client.query(
            `INSERT INTO schedule_slots (schedule_day_id, shift_id, employee_ids)
             VALUES ($1, $2, $3)`,
            [dayResult.rows[0].id, slot.shiftId, [...new Set(slot.employees)]]
          );
        }
      }
    });

    res.json(await listWeekSchedule(companyId));
  })
);

schedulesRouter.post(
  "/ai-suggest",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
    const busyRows = await listAvailability(companyId);
    const busyPreview = busyRows
      .slice(0, 2)
      .map((item) => `${item.employeeName} bận ${item.displayDate}`)
      .join("; ");

    res.json({
      reasons: [
        "Không xếp nhân viên đang nghỉ phép hoặc đã báo lịch bận.",
        "Ưu tiên nhân viên đang active, tránh xếp một người vào nhiều ca trong cùng ngày.",
        "Lấp các ca còn thiếu theo nhu cầu từng shift trước khi chủ sở hữu Apply Schedule.",
        busyRows.length ? `Đã đọc ${busyRows.length} lịch bận của nhân viên${busyPreview ? `: ${busyPreview}.` : "."}` : "Chưa có lịch bận nào được nhân viên gửi lên."
      ],
      warnings: busyRows.length ? ["Một số nhân viên có ngày bận, calendar sẽ chặn kéo-thả và AI sẽ né khi tự lấp ca."] : []
    });
  })
);

schedulesRouter.post(
  "/ai-suggest-legacy",
  asyncHandler(async (_req, res) => {
    res.json({
      reasons: [
        "Không xếp Hoàng Mỹ Linh và Nguyễn Phương Mai vì đang nghỉ phép.",
        "Giảm ca tối cho Phạm Gia Huy vì đã có 6.5 giờ OT trong tuần.",
        "Bổ sung Nguyễn Đức Long vào ca chiều Support để đủ 5 người.",
        "Giữ Phan Đức Khoa ở ca kho sớm để bảo toàn năng lực vận hành."
      ],
      warnings: ["Kho sớm ngày 21/05 chỉ có 2/4 nhân sự khả dụng."]
    });
  })
);
