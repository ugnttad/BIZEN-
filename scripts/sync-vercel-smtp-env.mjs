import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const envPath = join(rootDir, "BE", ".env");
const vercelProjectPath = join(rootDir, ".vercel", "project.json");
const vercelRepoPath = join(rootDir, ".vercel", "repo.json");
const smtpKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"];
const targetEnvironments = process.argv.slice(2).length ? process.argv.slice(2) : ["production"];

function parseDotenv(content) {
  const result = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

function runVercel(args) {
  const tokenArgs = process.env.VERCEL_TOKEN ? ["--token", process.env.VERCEL_TOKEN] : [];
  const vercelArgs = [...args, ...tokenArgs];

  if (process.platform === "win32") {
    const argEnv = Object.fromEntries(vercelArgs.map((arg, index) => [`VERCEL_SYNC_ARG_${index}`, arg]));
    const argList = vercelArgs.map((_, index) => `$env:VERCEL_SYNC_ARG_${index}`).join(", ");
    return spawnSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `$vercelArgs = @(${argList}); & npx vercel @vercelArgs`],
      {
        cwd: rootDir,
        encoding: "utf8",
        env: { ...process.env, ...argEnv },
        shell: false
      }
    );
  }

  return spawnSync("npx", ["vercel", ...vercelArgs], {
    cwd: rootDir,
    encoding: "utf8",
    shell: false
  });
}

if (!existsSync(envPath)) {
  console.error("Missing BE/.env. Add SMTP_* values there first.");
  process.exit(1);
}

if (!existsSync(vercelProjectPath) && !existsSync(vercelRepoPath)) {
  console.error("Project is not linked to Vercel yet. Run: npx vercel link");
  process.exit(1);
}

const env = parseDotenv(readFileSync(envPath, "utf8"));
const missingKeys = smtpKeys.filter((key) => !env[key]);

if (missingKeys.length) {
  console.error(`Missing SMTP values in BE/.env: ${missingKeys.join(", ")}`);
  process.exit(1);
}

for (const environment of targetEnvironments) {
  console.log(`Syncing SMTP env to Vercel ${environment}...`);

  for (const key of smtpKeys) {
    const added = runVercel(["env", "add", key, environment, "--yes", "--force", "--value", env[key]]);

    if (added.status !== 0) {
      console.error(`Failed to add ${key} to ${environment}.`);
      console.error((added.stderr || added.stdout || "").replaceAll(env[key], "[redacted]"));
      process.exit(added.status || 1);
    }

    console.log(`  ${key}=<synced>`);
  }
}

console.log("SMTP env sync completed. Redeploy Vercel to apply the new values.");
