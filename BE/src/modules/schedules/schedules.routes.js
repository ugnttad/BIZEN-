import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getCompanyIdForUser } from "../companies/company.repository.js";

export const schedulesRouter = Router();

schedulesRouter.get(
  "/week",
  asyncHandler(async (req, res) => {
    const companyId = await getCompanyIdForUser(req.user);
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
    res.json(result.rows);
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
