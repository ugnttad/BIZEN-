# KPI theo ca làm cho nhân viên cửa hàng

## Mục tiêu

Xây dựng tính năng KPI/nhiệm vụ theo ca để chủ quán giao việc cụ thể cho từng ca làm. Nhân viên nhìn thấy các việc cần hoàn thành trong khung giờ của ca, chụp ảnh minh chứng khi làm xong, hệ thống ghi nhận thời gian nộp và báo đúng hạn/trễ hạn để chủ quán kiểm tra.

Tính năng này giúp BIZEN chuyển từ "chấm công có mặt" sang "chấm công có kết quả công việc".

## Vai trò

- **Chủ quán/Admin**: tạo mẫu KPI, gán KPI theo ca/bộ phận/nhân viên, xem ảnh minh chứng, duyệt hoặc yêu cầu làm lại.
- **Nhân viên**: xem KPI của ca hiện tại, cập nhật tiến độ, chụp ảnh/upload minh chứng, gửi hoàn thành.
- **AI Assistant**: hỏi mô hình vận hành của từng quán và gợi ý bộ KPI mẫu phù hợp.

## Luồng nhân viên

1. Nhân viên vào giao diện mobile/web employee.
2. Hệ thống hiển thị ca hôm nay và mục **KPI cần hoàn thành**.
3. Mỗi KPI có:
   - Tên việc.
   - Mô tả ngắn.
   - Khung giờ cần hoàn thành.
   - Trạng thái: `Chưa làm`, `Đang làm`, `Đã nộp`, `Đã duyệt`, `Cần làm lại`, `Trễ`.
   - Nút chụp ảnh/upload ảnh.
4. Nhân viên hoàn thành việc, chụp ảnh minh chứng và bấm **Nộp KPI**.
5. Hệ thống lưu:
   - Thời gian bắt đầu nếu có.
   - Thời gian nộp.
   - Ảnh minh chứng.
   - Ghi chú của nhân viên nếu có.
   - Kết quả đúng hạn/trễ hạn.
6. Nếu nộp sau deadline, hệ thống đánh dấu `Trễ` nhưng vẫn cho chủ quán xem và duyệt.

Ví dụ ca sáng:

- 07:00-07:20: Setup bàn ghế.
- 07:00-07:30: Quét dọn khu vực khách.
- 07:20-07:40: Kiểm tra quầy order.
- 08:00-09:00: Chuẩn bị nguyên liệu đầu ca.

Ví dụ ca ít khách:

- Nấu trà sữa nền.
- Refill topping.
- Lau kệ trưng bày.
- Kiểm kho ly/ống hút/nguyên liệu.

## Luồng chủ quán

1. Chủ quán vào mục **KPI ca làm**.
2. Xem danh sách KPI theo ngày, ca, nhân viên hoặc bộ phận.
3. Mỗi KPI hiển thị:
   - Nhân viên phụ trách.
   - Ca làm.
   - Deadline.
   - Thời gian nhân viên nộp.
   - Trạng thái đúng hạn/trễ hạn.
   - Ảnh minh chứng.
4. Chủ quán có thể:
   - Bấm xem ảnh.
   - Duyệt KPI.
   - Từ chối/yêu cầu làm lại và nhập lý do.
   - Ghi chú nội bộ.
5. Dashboard có thống kê:
   - Số KPI hoàn thành đúng hạn.
   - Số KPI trễ.
   - Số KPI đang chờ duyệt.
   - Nhân viên/ca có nhiều KPI trễ.

## Cấu hình KPI theo từng quán

Vì mỗi quán vận hành khác nhau, KPI cần có 2 lớp:

### Mẫu KPI

Chủ quán tạo các mẫu nhiệm vụ thường dùng:

- Setup bàn ghế.
- Quét dọn khu vực khách.
- Lau nhà vệ sinh.
- Refill nguyên liệu.
- Nấu trà sữa nền.
- Kiểm kho cuối ca.
- Chốt ca/lau quầy.

Mỗi mẫu có:

- Tên KPI.
- Mô tả.
- Bộ phận áp dụng: phục vụ, pha chế, thu ngân, quản lý.
- Ca áp dụng: sáng, chiều, tối hoặc ca bất kỳ.
- Thời lượng/due time đề xuất.
- Có bắt buộc ảnh hay không.
- Số ảnh tối thiểu.

### KPI phát sinh theo ca

Khi lịch ca được tạo, hệ thống sinh KPI từ mẫu theo:

- Ca làm.
- Vai trò/bộ phận của nhân viên.
- Số lượng nhân viên trong ca.
- Loại ngày: ngày thường, cuối tuần, cao điểm.
- Quy định riêng của quán.

## AI hỏi theo từng quán

Khi onboarding hoặc trong Settings, AI Assistant hỏi chủ quán:

- Quán thuộc loại nào: cafe, trà sữa, ăn vặt, nhà hàng nhỏ?
- Có những bộ phận nào: phục vụ, pha chế, thu ngân, bếp?
- Ca sáng/chiều/tối bắt đầu và kết thúc lúc nào?
- Đầu ca cần làm gì?
- Giữa ca ít khách thường giao việc gì?
- Cuối ca cần checklist gì?
- KPI nào bắt buộc chụp ảnh?
- KPI nào cần chủ quán duyệt thủ công?
- Một nhân viên mỗi ca nên nhận tối đa bao nhiêu KPI?

AI trả về bộ KPI gợi ý, chủ quán có thể chỉnh trước khi lưu.

## Trạng thái KPI

- `Pending`: Chưa làm.
- `InProgress`: Đang làm.
- `Submitted`: Nhân viên đã nộp, chờ chủ quán duyệt.
- `Approved`: Chủ quán đã duyệt.
- `Rejected`: Chủ quán từ chối/yêu cầu làm lại.
- `Late`: Nhân viên nộp sau deadline.
- `Missed`: Quá ca nhưng chưa nộp.

Ghi chú: `Late` có thể đi kèm `Submitted` hoặc `Approved`. Ví dụ một KPI nộp trễ nhưng vẫn được chủ quán duyệt.

## Quy tắc đúng hạn/trễ hạn

- Mỗi KPI có `dueAt`.
- Khi nhân viên nộp, hệ thống lưu `submittedAt`.
- Nếu `submittedAt <= dueAt`: đúng hạn.
- Nếu `submittedAt > dueAt`: trễ.
- Nếu hết ca mà chưa nộp: missed.
- Chủ quán vẫn có thể duyệt KPI trễ nếu ảnh/minh chứng hợp lệ.

## Dữ liệu cần lưu

### kpi_templates

- id
- company_id
- title
- description
- department_id
- role/job_position
- shift_type
- default_due_offset_minutes
- requires_photo
- min_photo_count
- is_active
- created_at
- updated_at

### shift_kpi_tasks

- id
- company_id
- schedule_id
- employee_id
- template_id
- title
- description
- due_at
- status
- submitted_at
- reviewed_at
- reviewed_by
- rejection_reason
- employee_note
- created_at
- updated_at

### shift_kpi_task_photos

- id
- task_id
- image_key hoặc image_url
- uploaded_at

## Giao diện cần có

### Mobile/Employee

- Card **KPI ca hôm nay**.
- Danh sách nhiệm vụ theo deadline gần nhất.
- Badge đúng hạn/trễ/chờ duyệt.
- Nút chụp ảnh/upload.
- Modal gửi ảnh và ghi chú.

### Admin

- Trang **KPI ca làm**.
- Bộ lọc ngày, ca, nhân viên, trạng thái.
- Bảng nhiệm vụ.
- Preview ảnh.
- Nút duyệt/từ chối.
- Trang cấu hình mẫu KPI.

## Acceptance criteria

- Nhân viên chỉ thấy KPI của chính mình trong ca được phân.
- Nhân viên có thể nộp KPI kèm ảnh.
- Hệ thống tự ghi nhận `submittedAt`.
- Hệ thống tự đánh dấu đúng hạn/trễ dựa trên deadline.
- Chủ quán xem được ảnh và thời gian nộp.
- Chủ quán duyệt hoặc từ chối KPI.
- KPI bị từ chối có lý do và nhân viên thấy được lý do.
- KPI chưa nộp sau khi hết ca được tính là missed.
- AI có thể gợi ý mẫu KPI theo loại quán và ca làm.

## MVP đề xuất

Phase 1:

- Admin tạo mẫu KPI thủ công.
- Khi tạo/lưu lịch ca, admin gán KPI cho nhân viên.
- Nhân viên xem KPI, upload ảnh và nộp.
- Admin duyệt/từ chối.

Phase 2:

- Tự sinh KPI từ mẫu theo ca/bộ phận.
- Dashboard thống kê KPI.
- Thông báo nhắc deadline.

Phase 3:

- AI hỏi từng quán và tạo bộ KPI mẫu.
- AI cảnh báo ca nào thường trễ KPI.
- AI gợi ý tối ưu chia việc khi ca ít khách/nhiều khách.
