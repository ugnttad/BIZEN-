import { appUrl, renderEmail } from "./emailLayout.js";

function normalizeName(value, fallback = "bạn") {
  return String(value || "").trim() || fallback;
}

function normalizeCompany(value) {
  return String(value || "").trim() || "doanh nghiệp của bạn";
}

export function buildCompanyApprovedEmail({ ownerName, companyName }) {
  const owner = normalizeName(ownerName);
  const company = normalizeCompany(companyName);
  const title = `${company} đã sẵn sàng trên BIZEN`;
  const loginUrl = appUrl("/login");
  const text = [
    `Chào ${owner},`,
    `Yêu cầu đăng ký của ${company} đã được duyệt. Tài khoản chủ sở hữu của bạn đã sẵn sàng trên BIZEN.`,
    `Đăng nhập tại ${loginUrl} để thiết lập đội ngũ, chấm công, ca làm, checklist và bảng lương.`
  ].join(" ");
  const html = renderEmail({
    title,
    preheader: `Workspace BIZEN của ${company} đã được duyệt.`,
    greeting: `Chào ${owner},`,
    paragraphs: [
      `Yêu cầu đăng ký của ${company} đã được duyệt. Workspace và tài khoản chủ sở hữu của bạn đã sẵn sàng để bắt đầu vận hành.`,
      "Bạn có thể đăng nhập để hoàn thiện thông tin doanh nghiệp, tạo nhân viên, thiết lập chấm công, xếp ca, checklist và bảng lương."
    ],
    highlights: [
      "Tạo hồ sơ nhân viên và phân quyền truy cập.",
      "Thiết lập vị trí GPS, Face ID, ca làm và giờ đi trễ/OT.",
      "Theo dõi checklist, nghỉ phép, bảng lương và báo cáo vận hành."
    ],
    notice: "BIZEN được thiết kế linh hoạt cho nhiều mô hình: cửa hàng, phòng khám, spa, xưởng, trung tâm dịch vụ, bán lẻ và các đội vận hành nhỏ.",
    ctaUrl: loginUrl,
    ctaLabel: "Đăng nhập BIZEN"
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}

export function buildEmployeeApprovedEmail({ employeeName, companyName }) {
  const employee = normalizeName(employeeName);
  const company = normalizeCompany(companyName);
  const title = `Bạn đã được duyệt vào workspace ${company}`;
  const loginUrl = appUrl("/login");
  const text = [
    `Chào ${employee},`,
    `Tài khoản BIZEN của bạn tại ${company} đã được duyệt.`,
    `Đăng nhập tại ${loginUrl} để xem lịch làm, chấm công, checklist, lương và nghỉ phép.`
  ].join(" ");
  const html = renderEmail({
    title,
    preheader: `Tài khoản BIZEN của bạn tại ${company} đã sẵn sàng.`,
    greeting: `Chào ${employee},`,
    paragraphs: [
      `Tài khoản BIZEN của bạn tại ${company} đã được duyệt và có thể sử dụng ngay.`,
      "Sau khi đăng nhập, bạn có thể xem lịch làm, chấm công bằng mobile, cập nhật hồ sơ cá nhân và theo dõi các thông báo từ doanh nghiệp."
    ],
    highlights: [
      "Xem ca làm và các checklist cần hoàn thành.",
      "Chấm công theo chính sách GPS/Face ID của doanh nghiệp.",
      "Theo dõi ngày công, bảng lương và yêu cầu nghỉ phép."
    ],
    notice: "Nếu bạn chưa biết mật khẩu hoặc không đăng nhập được, hãy liên hệ quản lý/chủ sở hữu workspace để được hỗ trợ.",
    ctaUrl: loginUrl,
    ctaLabel: "Đăng nhập tài khoản"
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}

export function buildEmployeeCreatedEmail({ employeeName, companyName }) {
  const employee = normalizeName(employeeName);
  const company = normalizeCompany(companyName);
  const title = `Tài khoản BIZEN của bạn tại ${company} đã được tạo`;
  const loginUrl = appUrl("/login");
  const text = [
    `Chào ${employee},`,
    `${company} đã tạo tài khoản BIZEN cho bạn.`,
    `Hãy đăng nhập bằng email này và mật khẩu được cấp tại ${loginUrl}.`
  ].join(" ");
  const html = renderEmail({
    title,
    preheader: `${company} đã tạo tài khoản BIZEN cho bạn.`,
    greeting: `Chào ${employee},`,
    paragraphs: [
      `${company} đã tạo tài khoản BIZEN cho bạn. Hãy đăng nhập bằng email nhận được thông báo này và mật khẩu do quản lý/chủ sở hữu cung cấp.`,
      "Sau khi vào hệ thống, bạn có thể cập nhật thông tin cá nhân, xem lịch làm, chấm công, hoàn thành checklist và theo dõi lương."
    ],
    highlights: [
      "Dùng cùng một tài khoản cho web và mobile.",
      "Cập nhật số điện thoại, ảnh đại diện và thông tin hồ sơ trong phần Profile.",
      "Bảo mật mật khẩu và đổi mật khẩu nếu được yêu cầu."
    ],
    notice: "Nếu bạn không thuộc doanh nghiệp này hoặc không nhận được mật khẩu, hãy phản hồi với quản lý/chủ sở hữu trước khi đăng nhập.",
    ctaUrl: loginUrl,
    ctaLabel: "Đăng nhập BIZEN"
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}

export function buildPasswordResetEmail({ userName, resetUrl }) {
  const user = normalizeName(userName);
  const title = "Đặt lại mật khẩu BIZEN";
  const text = [
    `Chào ${user},`,
    `BIZEN đã nhận yêu cầu đặt lại mật khẩu cho tài khoản của bạn.`,
    `Link có hiệu lực trong 30 phút: ${resetUrl}`,
    "Nếu bạn không yêu cầu, hãy bỏ qua email này."
  ].join(" ");
  const html = renderEmail({
    title,
    preheader: "Link đặt lại mật khẩu BIZEN có hiệu lực trong 30 phút.",
    greeting: `Chào ${user},`,
    paragraphs: [
      "BIZEN đã nhận yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
      "Vì lý do bảo mật, liên kết này chỉ có hiệu lực trong 30 phút. Sau khi đổi mật khẩu, hãy đăng nhập lại bằng mật khẩu mới."
    ],
    highlights: [
      "Không chia sẻ liên kết này cho người khác.",
      "Bỏ qua email nếu bạn không thực hiện yêu cầu đặt lại mật khẩu.",
      "Liên hệ quản lý/chủ sở hữu workspace nếu tài khoản vẫn không truy cập được."
    ],
    notice: "BIZEN sẽ không bao giờ yêu cầu bạn gửi mật khẩu qua email hoặc tin nhắn.",
    ctaUrl: resetUrl,
    ctaLabel: "Đặt lại mật khẩu"
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}
