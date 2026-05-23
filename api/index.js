import { createApp } from "../BE/src/app.js";

const app = createApp();

function normalizeApiRequestUrl(req) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  const rewrittenPath = url.searchParams.get("path");

  if (rewrittenPath && (url.pathname === "/api" || url.pathname === "/api/")) {
    url.searchParams.delete("path");
    const normalizedPath = rewrittenPath.replace(/^\/+/, "");
    const search = url.searchParams.toString();
    req.url = `/api/${normalizedPath}${search ? `?${search}` : ""}`;
    return;
  }

  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }
}

export default function handler(req, res) {
  normalizeApiRequestUrl(req);
  return app(req, res);
}
