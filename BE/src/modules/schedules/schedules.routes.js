import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { httpError } from "../../shared/httpError.js";
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
