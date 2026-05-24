import "dotenv/config";

function parseOrigins(value) {
  return (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(toOrigin)
    .filter(Boolean);
}

function toOrigin(value) {
  if (!value) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).origin;
  } catch {
    return "";
  }
}

const configuredClientOrigins = parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5173");
const vercelClientOrigins = [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
]
  .map(toOrigin)
  .filter(Boolean);

const defaultGoogleClientId = "518331039125-i79o5esjg5v5eiim93rdapvtfp0elk4n.apps.googleusercontent.com";
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.NEON_DATABASE_URL ||
  "";
const awsRekognitionEnabledValue = (process.env.AWS_REKOGNITION_ENABLED || "").trim().toLowerCase();
const hasAwsStaticCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const hasAwsProviderCredentials = Boolean(process.env.AWS_PROFILE || process.env.AWS_WEB_IDENTITY_TOKEN_FILE || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI);
const awsRekognitionEnabled =
  awsRekognitionEnabledValue === "true" || awsRekognitionEnabledValue === "1"
    ? true
    : awsRekognitionEnabledValue === "false" || awsRekognitionEnabledValue === "0"
      ? false
      : hasAwsStaticCredentials || hasAwsProviderCredentials;
const smtpSecureValue = (process.env.SMTP_SECURE || "").trim().toLowerCase();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl,
  clientOrigin: configuredClientOrigins[0] || "http://localhost:5173",
  clientOrigins: [...new Set([...configuredClientOrigins, ...vercelClientOrigins])],
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || defaultGoogleClientId,
  awsRegion: process.env.AWS_REGION || "ap-southeast-1",
  awsRekognitionEnabled,
  awsRekognitionCollectionId: process.env.AWS_REKOGNITION_COLLECTION_ID || "bizen-employees",
  awsRekognitionMinSimilarity: Number(process.env.AWS_REKOGNITION_MIN_SIMILARITY || 90),
  awsRekognitionFaceMinConfidence: Number(process.env.AWS_REKOGNITION_FACE_MIN_CONFIDENCE || 90),
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: smtpSecureValue === "true" || smtpSecureValue === "1",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || "BIZEN <no-reply@bizen.vn>",
  businessTimeZone: process.env.BUSINESS_TIME_ZONE || "Asia/Ho_Chi_Minh",
  platformAdminEmail: process.env.PLATFORM_ADMIN_EMAIL || "platform@bizen.vn",
  platformAdminPassword: process.env.PLATFORM_ADMIN_PASSWORD || "Platform@2026",
  passwordLoginSecret: process.env.PASSWORD_LOGIN_SECRET || "Bizen@2026",
  jwtSecret: process.env.JWT_SECRET || "bizen-dev-secret-change-me"
};

export function assertEnv() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required. Set DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL to your Neon connection string.");
  }
}
