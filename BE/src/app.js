import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./routes.js";

function isDevLanOrigin(origin) {
  if (!origin || env.nodeEnv === "production") return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    const port = url.port;
    const isVitePort = port === "5173";
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isPrivateLan =
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    return isVitePort && (isLocalhost || isPrivateLan);
  } catch {
    return false;
  }
}

function isSameHostOrigin(origin, host) {
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function resolveCorsOptions(req, callback) {
  const origin = req.headers.origin;
  const isAllowedOrigin =
    !origin || isSameHostOrigin(origin, req.headers.host) || env.clientOrigins.includes(origin) || isDevLanOrigin(origin);

  if (isAllowedOrigin) {
    callback(null, { origin: true, credentials: true });
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(resolveCorsOptions));
  app.use(express.json({ limit: "5mb" }));
  app.use(morgan("dev"));

  app.get(["/health", "/api/health"], (_req, res) => {
    res.json({ ok: true, service: "bizen-backend" });
  });

  app.use("/api", apiRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found", path: req.path });
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || "Internal server error"
    });
  });

  return app;
}
