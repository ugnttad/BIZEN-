# Checklist ca làm cho nhân viên cửa hàng

## Mục tiêu

Xây dựng tính năng checklist/todo theo ca để chủ quán giao việc cụ thể cho từng ca làm. Nhân viên nhìn thấy các việc cần hoàn thành trong khung giờ của ca, chụp ảnh minh chứng khi làm xong, hệ thống ghi nhận thời gian nộp và báo đúng hạn/trễ hạn để chủ quán kiểm tra.

Tính năng này không phải KPI đánh giá hiệu suất theo tháng. Đây là checklist vận hành hằng ca, giúp BIZEN chuyển từ "chấm công có mặt" sang "chấm công có bằng chứng công việc".

## Vai trò

- **Chủ quán/Admin**: tạo mẫu checklist, gán việc theo ca/bộ phận/nhân viên, xem ảnh minh chứng, duyệt hoặc yêu cầu làm lại.
- **Nhân viên**: xem checklist của ca hiện tại, cập nhật tiến độ, chụp ảnh/upload minh chứng, gửi hoàn thành.
- **AI Assistant**: hỏi mô hình vận hành của từng quán và gợi ý bộ checklist mẫu phù hợp.

## Luồng nhân viên

1. Nhân viên vào giao diện mobile/web employee.
2. Hệ thống hiển thị ca hôm nay và mục **Checklist cần hoàn thành**.
3. Mỗi việc cần làm có:
   - Tên việc.
   - Mô tả ngắn.
   - Khung giờ cần hoàn thành.
   - Trạng thái: `Chưa làm`, `Đang làm`, `Đã nộp`, `Đã duyệt`, `Cần làm lại`, `Trễ`.
   - Nút chụp ảnh/upload ảnh.
4. Nhân viên hoàn thành việc, chụp ảnh minh chứng và bấm **Nộp ảnh**.
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

1. Chủ quán vào mục **Checklist ca làm**.
2. Xem danh sách việc theo ngày, ca, nhân viên hoặc bộ phận.
3. Mỗi việc hiển thị:
   - Nhân viên phụ trách.
   - Ca làm.
   - Deadline.
   - Thời gian nhân viên nộp.
   - Trạng thái đúng hạn/trễ hạn.
   - Ảnh minh chứng.
4. Chủ quán có thể:
   - Bấm xem ảnh.
   - Duyệt checklist.
   - Từ chối/yêu cầu làm lại và nhập lý do.
   - Ghi chú nội bộ.
5. Dashboard có thống kê:
   - Số việc hoàn thành đúng hạn.
   - Số việc trễ.
   - Số việc đang chờ duyệt.
   - Nhân viên/ca có nhiều việc trễ.

## Cấu hình checklist theo từng quán

Vì mỗi quán vận hành khác nhau, checklist cần có 2 lớp:

### Mẫu checklist

Chủ quán tạo các mẫu nhiệm vụ thường dùng:

- Setup bàn ghế.
- Quét dọn khu vực khách.
- Lau nhà vệ sinh.
- Refill nguyên liệu.
- Nấu trà sữa nền.
- Kiểm kho cuối ca.
- Chốt ca/lau quầy.

Mỗi mẫu có:

- Tên việc.
- Mô tả.
- Bộ phận áp dụng: phục vụ, pha chế, thu ngân, quản lý.
- Ca áp dụng: sáng, chiều, tối hoặc ca bất kỳ.
- Thời lượng/due time đề xuất.
- Có bắt buộc ảnh hay không.
- Số ảnh tối thiểu.

### Checklist phát sinh theo ca

Khi lịch ca được tạo, hệ thống sinh việc từ mẫu theo:

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
- Việc nào bắt buộc chụp ảnh?
- Việc nào cần chủ quán duyệt thủ công?
- Một nhân viên mỗi ca nên nhận tối đa bao nhiêu việc?

AI trả về bộ checklist gợi ý, chủ quán có thể chỉnh trước khi lưu.

## Trạng thái checklist

- `Pending`: Chưa làm.
- `InProgress`: Đang làm.
- `Submitted`: Nhân viên đã nộp, chờ chủ quán duyệt.
- `Approved`: Chủ quán đã duyệt.
- `Rejected`: Chủ quán từ chối/yêu cầu làm lại.
- `Late`: Nhân viên nộp sau deadline.
- `Missed`: Quá ca nhưng chưa nộp.

Ghi chú: `Late` có thể đi kèm `Submitted` hoặc `Approved`. Ví dụ một việc nộp trễ nhưng vẫn được chủ quán duyệt.

## Quy tắc đúng hạn/trễ hạn

- Mỗi việc có `dueAt`.
- Khi nhân viên nộp, hệ thống lưu `submittedAt`.
- Nếu `submittedAt <= dueAt`: đúng hạn.
- Nếu `submittedAt > dueAt`: trễ.
- Nếu hết ca mà chưa nộp: missed.
- Chủ quán vẫn có thể duyệt việc trễ nếu ảnh/minh chứng hợp lệ.

## Dữ liệu cần lưu

### kpi_templates

Tên bảng kỹ thuật vẫn giữ tiền tố `kpi` để tránh đổi schema lớn. Trên giao diện và requirement, tính năng được gọi là checklist ca làm.

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

- Card **Checklist ca hôm nay**.
- Danh sách nhiệm vụ theo deadline gần nhất.
- Badge đúng hạn/trễ/chờ duyệt.
- Nút chụp ảnh/upload.
- Modal gửi ảnh và ghi chú.

### Admin

- Trang **Checklist ca làm**.
- Bộ lọc ngày, ca, nhân viên, trạng thái.
- Bảng nhiệm vụ.
- Preview ảnh.
- Nút duyệt/từ chối.
- Trang cấu hình mẫu checklist.

## Acceptance criteria

- Nhân viên chỉ thấy checklist của chính mình trong ca được phân.
- Nhân viên có thể nộp việc kèm ảnh.
- Hệ thống tự ghi nhận `submittedAt`.
- Hệ thống tự đánh dấu đúng hạn/trễ dựa trên deadline.
- Chủ quán xem được ảnh và thời gian nộp.
- Chủ quán duyệt hoặc từ chối việc.
- Việc bị từ chối có lý do và nhân viên thấy được lý do.
- Việc chưa nộp sau khi hết ca được tính là missed.
- AI có thể gợi ý mẫu checklist theo loại quán và ca làm.

## Lộ trình triển khai

Phase 1:

- Admin tạo việc checklist thủ công.
- Khi tạo/lưu lịch ca, admin gán việc cho nhân viên.
- Nhân viên xem checklist, upload ảnh và nộp.
- Admin duyệt/từ chối.

Phase 2:

- Tự sinh checklist từ mẫu theo ca/bộ phận.
- Dashboard thống kê checklist.
- Thông báo nhắc deadline.

Phase 3:

- AI hỏi từng quán và tạo bộ checklist mẫu.
- AI cảnh báo ca nào thường trễ checklist.
- AI gợi ý tối ưu chia việc khi ca ít khách/nhiều khách.
