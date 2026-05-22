/**
 * Apply 004_auth_flow_repair.sql via Supabase Management API.
 *
 * Requires a personal access token (NOT the service role key):
 *   https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
 *   node scripts/apply-migration-api.mjs
 *
 * Or add SUPABASE_ACCESS_TOKEN=... to .env.local (do not commit).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "tpjytzdwuaqveugefxwp";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MIGRATION_PATH = path.join(
  ROOT,
  "supabase/migrations/004_auth_flow_repair.sql",
);

function loadToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

async function runQuery(token, sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const token = loadToken();
  if (!token) {
    console.error(`
Missing SUPABASE_ACCESS_TOKEN.

Option 1 — CLI login (interactive):
  npx supabase login
  npx supabase link --project-ref ${PROJECT_REF}
  .\\scripts\\supabase-apply-auth-repair.ps1

Option 2 — Personal access token:
  1. Create token: https://supabase.com/dashboard/account/tokens
  2. In PowerShell:
       $env:SUPABASE_ACCESS_TOKEN = "sbp_your_token"
       node scripts/apply-migration-api.mjs
`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
  console.log(`Applying migration to project ${PROJECT_REF}…\n`);

  const result = await runQuery(token, sql);
  if (!result.ok) {
    console.error("Migration failed:", result.status, result.body);
    process.exit(1);
  }

  console.log("Migration applied successfully.\n");
  if (Array.isArray(result.body)) {
    console.table(result.body);
  } else {
    console.log(JSON.stringify(result.body, null, 2));
  }

  console.log(`
Verify: you should see 4 policies on profiles (profiles_insert_own, profiles_select_anon, profiles_select_authenticated, profiles_update_own).

Auth URLs (manual):
  https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
