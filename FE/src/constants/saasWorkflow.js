/** MVP demo — 3 tính năng trọng tâm khi pitch / Figma / live demo */
export const mvpDemoFeatures = [
  {
    id: "onboarding",
    title: "Đăng ký & duyệt doanh nghiệp",
    pain: "SME muốn dùng SaaS nhưng chủ nền tảng phải kiểm soát ai được vào hệ thống — tránh spam tenant và dữ liệu lẫn công ty.",
    steps: [
      "Doanh nghiệp: Landing → Đăng ký doanh nghiệp → Gửi yêu cầu (Pending)",
      "Bạn (Platform Admin): Đăng nhập → Duyệt doanh nghiệp → Approve",
      "Admin DN: Đăng nhập bằng email đã đăng ký → Vào web dashboard"
    ],
    skippable: [
      { step: "Bước duyệt Platform Admin", canSkip: false, effect: "Không tạo company, không đăng nhập được Admin DN." },
      { step: "Đăng ký doanh nghiệp", canSkip: false, effect: "Không có tenant trong hệ thống." }
    ]
  },
  {
    id: "face-attendance",
    title: "Chấm công Face ID + HR duyệt",
    pain: "Chấm công giấy/Excel dễ gian lận, HR mất giờ đối soát — cần xác thực khuôn mặt và bảng công tập trung.",
    steps: [
      "Admin/HR: Tạo hồ sơ nhân viên trên web",
      "Nhân viên: Mobile → Đăng ký khuôn mặt → Chờ HR duyệt",
      "HR: Web → Face ID → Approve → Nhân viên Scan Face → Bảng chấm công cập nhật"
    ],
    skippable: [
      { step: "HR duyệt Face ID", canSkip: false, effect: "Nút chấm công bị khóa; API trả lỗi enrollment chưa Approved." },
      { step: "Đăng ký khuôn mặt (employee)", canSkip: false, effect: "Không có mẫu Rekognition → không chấm công được." },
      { step: "Tạo hồ sơ nhân viên", canSkip: false, effect: "Employee không có employeeId → không dùng mobile." }
    ]
  },
  {
    id: "hr-ops",
    title: "HR vận hành: nhân sự & duyệt tài khoản",
    pain: "Onboarding nhân viên rời rạc (Zalo, email, Excel) — cần một cổng duyệt tài khoản gắn đúng hồ sơ công ty.",
    steps: [
      "Nhân viên: Yêu cầu tài khoản (email trùng hồ sơ HR đã tạo)",
      "HR: Web → Tài khoản → Approve",
      "Nhân viên: Mobile login → Home / lịch / công"
    ],
    skippable: [
      { step: "HR duyệt tài khoản", canSkip: false, effect: "Login trả 403 Account not approved." },
      { step: "HR tạo hồ sơ trước", canSkip: false, effect: "API từ chối — chưa có employee profile." }
    ]
  }
];

export const demoScriptOrder = [
  "Đăng ký công ty demo → Platform approve",
  "Admin DN tạo NV + duyệt tài khoản",
  "NV đăng ký Face ID → HR approve → Chấm công",
  "HR xem Bảng chấm công (tùy thời gian demo)"
];
