import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  awsRegion: process.env.AWS_REGION || "ap-southeast-1",
  awsRekognitionCollectionId: process.env.AWS_REKOGNITION_COLLECTION_ID || "bizen-employees",
  awsRekognitionMinSimilarity: Number(process.env.AWS_REKOGNITION_MIN_SIMILARITY || 90),
  awsRekognitionFaceMinConfidence: Number(process.env.AWS_REKOGNITION_FACE_MIN_CONFIDENCE || 90),
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
  businessTimeZone: process.env.BUSINESS_TIME_ZONE || "Asia/Ho_Chi_Minh",
  platformAdminEmail: process.env.PLATFORM_ADMIN_EMAIL || "platform@bizen.vn",
  platformAdminPassword: process.env.PLATFORM_ADMIN_PASSWORD || "Platform@2026",
  passwordLoginSecret: process.env.PASSWORD_LOGIN_SECRET || "Bizen@2026",
  jwtSecret: process.env.JWT_SECRET || "bizen-dev-secret-change-me"
};

export function assertEnv() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required. Copy BE/.env.example to BE/.env and set your Neon connection string.");
  }
}
