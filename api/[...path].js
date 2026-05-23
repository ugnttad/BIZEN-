import { createApp } from "../BE/src/app.js";
import { assertEnv } from "../BE/src/config/env.js";

assertEnv();

const app = createApp();

export default function handler(req, res) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }

  return app(req, res);
}
