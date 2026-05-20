import { createApp } from "./app.js";
import { pool } from "./config/db.js";
import { assertEnv, env } from "./config/env.js";

assertEnv();

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`BIZEN backend running on http://localhost:${env.port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
