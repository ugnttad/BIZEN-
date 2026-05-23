import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, query } from "../config/db.js";
import { assertEnv } from "../config/env.js";

assertEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "schema.sql");
const schema = await readFile(schemaPath, "utf8");

await query(schema);
await closePool();

console.log("Database migration completed.");
