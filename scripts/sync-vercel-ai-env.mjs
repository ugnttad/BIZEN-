import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const envPath = join(rootDir, "BE", ".env");
const vercelProjectPath = join(rootDir, ".vercel", "project.json");
const vercelRepoPath = join(rootDir, ".vercel", "repo.json");
const targetEnvironments = process.argv.slice(2).length ? process.argv.slice(2) : ["production"];

const requiredKeys = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REKOGNITION_COLLECTION_ID",
  "AWS_REKOGNITION_MIN_SIMILARITY",
  "AWS_REKOGNITION_FACE_MIN_CONFIDENCE"
];

const defaultValues = {
  GEMINI_MODEL: "gemini-2.5-flash",
  AWS_REKOGNITION_ENABLED: "true",
  FACE_ID_ALLOW_DEMO_MODE: "false"
};

const optionalKeys = Object.keys(defaultValues);

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

function redactedOutput(output, values) {
  return values.reduce((text, value) => text.replaceAll(value, "[redacted]"), output || "");
}

if (!existsSync(envPath)) {
  console.error("Missing BE/.env. Add Gemini and AWS values there first.");
  process.exit(1);
}

if (!existsSync(vercelProjectPath) && !existsSync(vercelRepoPath)) {
  console.error("Project is not linked to Vercel yet. Run: npx vercel link");
  process.exit(1);
}

const env = parseDotenv(readFileSync(envPath, "utf8"));
const missingKeys = requiredKeys.filter((key) => !env[key]);
const geminiApiKey = env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY;

if (!geminiApiKey || missingKeys.length) {
  const missing = [...(geminiApiKey ? [] : ["GEMINI_API_KEY"]), ...missingKeys];
  console.error(`Missing AI/AWS values in BE/.env: ${missing.join(", ")}`);
  process.exit(1);
}

const values = {
  ...defaultValues,
  GEMINI_API_KEY: geminiApiKey,
  ...Object.fromEntries(requiredKeys.map((key) => [key, env[key]])),
  ...Object.fromEntries(optionalKeys.filter((key) => env[key]).map((key) => [key, env[key]]))
};

const secretValues = Object.values(values).filter(Boolean);

for (const environment of targetEnvironments) {
  console.log(`Syncing Gemini/AWS env to Vercel ${environment}...`);

  for (const [key, value] of Object.entries(values)) {
    const added = runVercel(["env", "add", key, environment, "--yes", "--force", "--value", value]);

    if (added.status !== 0) {
      console.error(`Failed to add ${key} to ${environment}.`);
      console.error(redactedOutput(added.stderr || added.stdout || "", secretValues));
      process.exit(added.status || 1);
    }

    console.log(`  ${key}=<synced>`);
  }
}

console.log("Gemini/AWS env sync completed. Redeploy Vercel to apply the new values.");
