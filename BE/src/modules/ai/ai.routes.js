import { Router } from "express";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { getDefaultCompanyId } from "../companies/company.repository.js";

export const aiRouter = Router();

aiRouter.get(
  "/alerts",
  asyncHandler(async (_req, res) => {
    const companyId = await getDefaultCompanyId();
    const result = await query(
      `SELECT id, alert_type AS type, title, detail FROM ai_alerts WHERE company_id = $1 ORDER BY id`,
      [companyId]
    );
    res.json(result.rows);
  })
);

aiRouter.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const text = String(req.body.message || "").toLowerCase();
    let reply = "Tôi đã kiểm tra dữ liệu Neon và thấy 3 cảnh báo cần xử lý: đi trễ, thiếu nhân sự kho, OT Support tăng.";
    if (text.includes("lịch") || text.includes("xếp")) {
      reply = "AI đề xuất tăng 1 người cho ca chiều Sales, không xếp nhân viên đang nghỉ phép và giữ OT dưới 40 giờ/tuần.";
    } else if (text.includes("trễ")) {
      reply = "Top đi trễ tháng này: Trần Quốc Bảo 4 lần, Nguyễn Bảo Châu 3 lần, Phạm Thanh Đạt 3 lần.";
    } else if (text.includes("lương")) {
      reply = "Lương giảm chủ yếu do đi trễ, ngày công thiếu và khoản khấu trừ trong tháng 05/2026.";
    } else if (text.includes("thiếu")) {
      reply = "Warehouse thiếu 1 người ở ca kho sớm ngày 21/05.";
    }
    res.json({ reply });
  })
);
