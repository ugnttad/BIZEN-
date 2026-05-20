import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};

export function assertEnv() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required. Copy BE/.env.example to BE/.env and set your Neon connection string.");
  }
}
