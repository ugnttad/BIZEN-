/** MVP demo — 3 tính năng trọng tâm khi pitch / Figma / live demo */
export const mvpDemoFeatures = [
  {
    id: "onboarding",
    title: "Đăng ký & duyệt doanh nghiệp",
    pain: "SME muốn dùng SaaS nhưng chủ nền tảng phải kiểm soát ai được vào hệ thống — tránh spam tenant và dữ liệu lẫn công ty.",
    steps: [
      "Doanh nghiệp: Landing → Đăng ký doanh nghiệp → Gửi yêu cầu (Pending)",
      "Bạn (Platform Admin): Đăng nhập → Duyệt doanh nghiệp → Approve",
      "Chủ sở hữu: Đăng nhập bằng email đã đăng ký → Vào web dashboard"
    ],
    skippable: [
      { step: "Bước duyệt Platform Admin", canSkip: false, effect: "Không tạo company, không đăng nhập được chủ sở hữu." },
      { step: "Đăng ký doanh nghiệp", canSkip: false, effect: "Không có tenant trong hệ thống." }
    ]
  },
  {
    id: "face-attendance",
    title: "Chấm công Face ID + chủ sở hữu duyệt",
    pain: "Chấm công giấy/Excel dễ gian lận, chủ cửa hàng mất giờ đối soát — cần xác thực khuôn mặt và bảng công tập trung.",
    steps: [
      "Chủ sở hữu: Tạo hồ sơ nhân viên trên web",
      "Nhân viên: Mobile → Đăng ký khuôn mặt → Chờ chủ sở hữu duyệt",
      "Chủ sở hữu: Web → Face ID → Approve → Nhân viên Scan Face → Bảng chấm công cập nhật"
    ],
    skippable: [
      { step: "Chủ sở hữu duyệt Face ID", canSkip: false, effect: "Nút chấm công bị khóa; API trả lỗi enrollment chưa Approved." },
      { step: "Đăng ký khuôn mặt (employee)", canSkip: false, effect: "Không có mẫu Rekognition → không chấm công được." },
      { step: "Tạo hồ sơ nhân viên", canSkip: false, effect: "Employee không có employeeId → không dùng mobile." }
    ]
  },
  {
    id: "hr-ops",
    title: "Vận hành nhân sự: hồ sơ & duyệt tài khoản",
    pain: "Onboarding nhân viên rời rạc (Zalo, email, Excel) — cần một cổng duyệt tài khoản gắn đúng hồ sơ công ty.",
    steps: [
      "Nhân viên: Yêu cầu tài khoản (email trùng hồ sơ chủ sở hữu đã tạo)",
      "Chủ sở hữu: Web → Tài khoản → Approve",
      "Nhân viên: Mobile login → Home / lịch / công"
    ],
    skippable: [
      { step: "Chủ sở hữu duyệt tài khoản", canSkip: false, effect: "Login trả 403 Account not approved." },
      { step: "Chủ sở hữu tạo hồ sơ trước", canSkip: false, effect: "API từ chối — chưa có employee profile." }
    ]
  }
];

export const demoScriptOrder = [
  "Đăng ký công ty demo → Platform approve",
  "Chủ sở hữu tạo NV + duyệt tài khoản",
  "NV đăng ký Face ID → chủ sở hữu approve → Chấm công",
  "Chủ sở hữu xem Bảng chấm công (tùy thời gian demo)"
];
