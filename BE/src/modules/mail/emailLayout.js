import { env } from "../../config/env.js";

const brand = {
  ink: "#07113f",
  muted: "#64748b",
  blue: "#2563eb",
  sky: "#38bdf8",
  border: "#dbeafe",
  surface: "#ffffff",
  page: "#f5f9ff"
};

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function appUrl(path = "/") {
  return new URL(path, `${env.clientOrigin}/`).toString();
}

function renderParagraphs(paragraphs = []) {
  return paragraphs
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155">${escapeHtml(paragraph)}</p>`
    )
    .join("");
}

function renderHighlights(items = []) {
  if (!items.length) return "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 6px 0;border-collapse:separate;border-spacing:0 8px">
      ${items
        .filter(Boolean)
        .map(
          (item) => `
            <tr>
              <td width="28" valign="top" style="padding:0">
                <span style="display:inline-block;width:20px;height:20px;border-radius:999px;background:#ecfdf5;color:#059669;text-align:center;font-size:13px;line-height:20px;font-weight:700">✓</span>
              </td>
              <td style="padding:0;font-size:14px;line-height:1.55;color:#334155">${escapeHtml(item)}</td>
            </tr>
          `
        )
        .join("")}
    </table>
  `;
}

function renderNotice(notice) {
  if (!notice) return "";

  return `
    <div style="margin-top:18px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:14px 16px">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#1e3a8a">${escapeHtml(notice)}</p>
    </div>
  `;
}

function renderCta({ ctaUrl, ctaLabel }) {
  if (!ctaUrl) return "";
  const safeUrl = escapeHtml(ctaUrl);
  const safeLabel = escapeHtml(ctaLabel || "Mở BIZEN");

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px">
      <tr>
        <td style="border-radius:12px;background:${brand.blue}">
          <a href="${safeUrl}" style="display:inline-block;padding:13px 18px;border-radius:12px;background:${brand.blue};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0 0;font-size:12px;line-height:1.55;color:${brand.muted}">
      Nếu nút không mở được, hãy dùng liên kết này:
      <br />
      <a href="${safeUrl}" style="color:${brand.blue};word-break:break-all;text-decoration:none">${safeUrl}</a>
    </p>
  `;
}

export function renderEmail({ title, preheader, greeting, paragraphs = [], highlights = [], notice, ctaUrl, ctaLabel }) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader || title);
  const safeGreeting = escapeHtml(greeting || "Xin chào,");

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:${brand.page};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${brand.ink}">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">
      ${safePreheader}
    </span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.page};padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px">
            <tr>
              <td style="padding:0 0 14px 0">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="width:44px;height:44px;border-radius:14px;background:${brand.ink};text-align:center;color:#ffffff;font-size:22px;font-weight:800;line-height:44px">B</td>
                          <td style="padding-left:12px">
                            <p style="margin:0;font-size:18px;line-height:1.2;font-weight:800;letter-spacing:.04em;color:${brand.ink}">BIZEN</p>
                            <p style="margin:3px 0 0 0;font-size:12px;line-height:1.3;color:${brand.muted}">Cloud HR & Payroll</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" style="vertical-align:middle">
                      <span style="display:inline-block;border:1px solid ${brand.border};background:#ffffff;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:700;color:${brand.blue}">
                        Workspace update
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid ${brand.border};border-radius:24px;background:${brand.surface};box-shadow:0 18px 48px rgba(15,23,42,.08);overflow:hidden">
                <div style="height:5px;background:${brand.blue}"></div>
                <div style="padding:30px 28px 28px 28px">
                  <p style="margin:0 0 10px 0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:${brand.blue}">Thông báo từ BIZEN</p>
                  <h1 style="margin:0 0 18px 0;font-size:26px;line-height:1.25;color:${brand.ink};font-weight:800">${safeTitle}</h1>
                  <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155">${safeGreeting}</p>
                  ${renderParagraphs(paragraphs)}
                  ${renderHighlights(highlights)}
                  ${renderNotice(notice)}
                  ${renderCta({ ctaUrl, ctaLabel })}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 8px 0 8px">
                <p style="margin:0;text-align:center;font-size:12px;line-height:1.6;color:${brand.muted}">
                  Email này được gửi tự động từ BIZEN. Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email.
                </p>
                <p style="margin:8px 0 0 0;text-align:center;font-size:12px;line-height:1.6;color:#94a3b8">
                  BIZEN hỗ trợ nhiều mô hình vận hành: bán lẻ, F&B, phòng khám, spa, xưởng, giáo dục, logistics và các dịch vụ nhỏ.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
