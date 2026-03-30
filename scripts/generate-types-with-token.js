#!/usr/bin/env node
/**
 * Generate Supabase types using an access token
 * Usage: SUPABASE_ACCESS_TOKEN=your_token node scripts/generate-types-with-token.js
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed
        .slice(eqIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function getProjectId(url) {
  // Extract project ID from Supabase URL: https://<project-id>.supabase.co
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error(`Could not extract project ID from URL: ${url}`);
  return match[1];
}

async function main() {
  loadEnv();

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "Error: SUPABASE_ACCESS_TOKEN environment variable is not set.",
    );
    console.error(
      "Usage: SUPABASE_ACCESS_TOKEN=your_token node scripts/generate-types-with-token.js",
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set.",
    );
    process.exit(1);
  }

  const projectId = getProjectId(supabaseUrl);
  const outputPath = path.join(
    __dirname,
    "..",
    "app",
    "types",
    "database.types.ts",
  );
  const schemas =
    "budget,waitlist,contact,admin,parent_app,attendance,billing,calendar,chat,donations,email_logs,marketing,teachers";

  console.log(`Generating types for project: ${projectId}`);
  console.log(`Schemas: ${schemas}`);
  console.log(`Output: ${outputPath}`);

  const cmd = `SUPABASE_ACCESS_TOKEN=${token} npx supabase gen types typescript --project-id ${projectId} --schema ${schemas} > "${outputPath}"`;

  try {
    execSync(cmd, { stdio: ["ignore", "pipe", "inherit"], shell: true });
    console.log("Types generated successfully!");
  } catch (error) {
    console.error("Failed to generate types:", error.message);
    process.exit(1);
  }
}

main();
