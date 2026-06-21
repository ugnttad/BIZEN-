import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export {
  buildCompanyApprovedEmail,
  buildEmployeeApprovedEmail,
  buildEmployeeCreatedEmail,
  buildPasswordResetEmail
} from "./templates.js";

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

function getFromAddress() {
  if (!env.mailFrom) return "BIZEN <no-reply@bizen.vn>";
  return env.mailFrom.includes("<") ? env.mailFrom : `BIZEN <${env.mailFrom}>`;
}

export async function sendMail({ to, subject, text, html }) {
  if (!to) return { skipped: true, reason: "missing-recipient" };
  if (!isConfigured()) {
    console.info(`[mail:skip] ${subject} -> ${to}. SMTP is not configured.`);
    return { skipped: true, reason: "smtp-not-configured" };
  }

  try {
    return await getTransporter().sendMail({
      from: getFromAddress(),
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
