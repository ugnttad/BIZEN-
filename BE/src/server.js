import { createApp } from "./app.js";
import { closePool } from "./config/db.js";
import { assertEnv, env } from "./config/env.js";

assertEnv();

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`BIZEN backend running on http://localhost:${env.port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.port} is already in use. Stop the existing backend process or change PORT in BE/.env.`);
    process.exit(1);
  }
  throw error;
});

function shutdown() {
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
