import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

let transporter;

function isConfigured() {
  return Boolean(env.smtpHost && env.mailFrom);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
    });
  }
  return transporter;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrapEmail({ title, body, ctaUrl, ctaLabel }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
        <div style="font-size:14px;font-weight:700;color:#2563eb;margin-bottom:12px">BIZEN</div>
        <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">${escapeHtml(title)}</h1>
        <div style="font-size:15px;line-height:1.6;color:#334155">${body}</div>
        ${
          ctaUrl
            ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;margin-top:20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:700">${escapeHtml(ctaLabel || "Mở BIZEN")}</a>`
            : ""
        }
        <p style="font-size:12px;line-height:1.5;color:#64748b;margin-top:24px">Email này được gửi tự động từ BIZEN. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
      </div>
    </div>
  `;
}

export async function sendMail({ to, subject, text, html }) {
  if (!to) return { skipped: true, reason: "missing-recipient" };
  if (!isConfigured()) {
    console.info(`[mail:skip] ${subject} -> ${to}. SMTP is not configured.`);
    return { skipped: true, reason: "smtp-not-configured" };
  }

  try {
    return await getTransporter().sendMail({
      from: env.mailFrom,
      to,
      subject,
      text,
      html
    });
  } catch (error) {
    console.warn(`[mail:error] ${subject} -> ${to}: ${error.message}`);
    return { skipped: true, reason: error.message };
  }
}

export function buildCompanyApprovedEmail({ ownerName, companyName }) {
  const title = `${companyName} đã được tạo thành công`;
  const text = `Chào ${ownerName}, chúc mừng! Doanh nghiệp ${companyName} đã được duyệt và tài khoản chủ sở hữu của bạn đã sẵn sàng trên BIZEN. Đăng nhập tại ${env.clientOrigin}/login.`;
  const html = wrapEmail({
    title,
    ctaUrl: `${env.clientOrigin}/login`,
    ctaLabel: "Đăng nhập BIZEN",
    body: `
      <p>Chào <strong>${escapeHtml(ownerName)}</strong>,</p>
      <p>Chúc mừng! Doanh nghiệp <strong>${escapeHtml(companyName)}</strong> đã được duyệt và tài khoản chủ sở hữu của bạn đã sẵn sàng.</p>
      <p>Bạn có thể đăng nhập để tạo nhân viên, xếp ca, duyệt Face ID, chấm công và quản lý lương.</p>
    `
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}

export function buildEmployeeRequestEmail({ employeeName, companyName }) {
  const title = `Yêu cầu tham gia ${companyName} đã được ghi nhận`;
  const text = `Chào ${employeeName}, yêu cầu tài khoản của bạn tại ${companyName} đã được gửi tới chủ sở hữu. Bạn sẽ nhận email khi tài khoản được duyệt.`;
  const html = wrapEmail({
    title,
    body: `
      <p>Chào <strong>${escapeHtml(employeeName)}</strong>,</p>
      <p>Yêu cầu tham gia <strong>${escapeHtml(companyName)}</strong> đã được ghi nhận.</p>
      <p>Chủ sở hữu sẽ kiểm tra và duyệt tài khoản cho bạn. Khi được duyệt, bạn có thể đăng nhập BIZEN để xem lịch, chấm công, lương và nghỉ phép.</p>
    `
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}

export function buildEmployeeApprovedEmail({ employeeName, companyName }) {
  const title = `Bạn đã được duyệt vào ${companyName}`;
  const text = `Chào ${employeeName}, chúc mừng! Tài khoản BIZEN của bạn tại ${companyName} đã được duyệt. Đăng nhập tại ${env.clientOrigin}/login.`;
  const html = wrapEmail({
    title,
    ctaUrl: `${env.clientOrigin}/login`,
    ctaLabel: "Đăng nhập tài khoản",
    body: `
      <p>Chào <strong>${escapeHtml(employeeName)}</strong>,</p>
      <p>Chúc mừng! Tài khoản BIZEN của bạn tại <strong>${escapeHtml(companyName)}</strong> đã được duyệt.</p>
      <p>Bạn có thể đăng nhập để xem lịch làm, chấm công Face ID, theo dõi lương và gửi đơn nghỉ phép.</p>
    `
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}

export function buildEmployeeCreatedEmail({ employeeName, companyName }) {
  const title = `Tài khoản BIZEN tại ${companyName} đã sẵn sàng`;
  const text = `Chào ${employeeName}, chủ sở hữu ${companyName} đã tạo tài khoản BIZEN cho bạn. Đăng nhập bằng email này và mật khẩu được cấp tại ${env.clientOrigin}/login.`;
  const html = wrapEmail({
    title,
    ctaUrl: `${env.clientOrigin}/login`,
    ctaLabel: "Đăng nhập BIZEN",
    body: `
      <p>Chào <strong>${escapeHtml(employeeName)}</strong>,</p>
      <p>Chủ sở hữu <strong>${escapeHtml(companyName)}</strong> đã tạo tài khoản BIZEN cho bạn.</p>
      <p>Hãy đăng nhập bằng email này và mật khẩu được cấp để bắt đầu dùng web/mobile.</p>
    `
  });
  return { subject: `[BIZEN] ${title}`, text, html };
}
