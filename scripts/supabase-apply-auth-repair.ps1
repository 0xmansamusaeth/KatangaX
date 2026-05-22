# Apply supabase/migrations/004_auth_flow_repair.sql to the linked remote project.
# Prerequisites (one-time):
#   1. npx supabase login          (opens browser, stores access token)
#   2. npx supabase link --project-ref tpjytzdwuaqveugefxwp
#      (paste your database password from Supabase → Settings → Database)
#
# Usage:
#   .\scripts\supabase-apply-auth-repair.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "tpjytzdwuaqveugefxwp"
$Migration = Join-Path $PSScriptRoot "..\supabase\migrations\004_auth_flow_repair.sql"

Write-Host "KatangaX — apply 004_auth_flow_repair.sql" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef`n"

if (-not (Test-Path $Migration)) {
  throw "Migration file not found: $Migration"
}

# Prefer Management API if a personal access token is available.
if ($env:SUPABASE_ACCESS_TOKEN -or (Select-String -Path (Join-Path $PSScriptRoot "..\.env.local") -Pattern "^SUPABASE_ACCESS_TOKEN=" -Quiet -ErrorAction SilentlyContinue)) {
  Write-Host "Using SUPABASE_ACCESS_TOKEN + Management API…" -ForegroundColor Cyan
  node (Join-Path $PSScriptRoot "apply-migration-api.mjs")
  if ($LASTEXITCODE -eq 0) { exit 0 }
  Write-Host "API apply failed; falling back to CLI…" -ForegroundColor Yellow
}

Write-Host "Checking Supabase CLI login…"
$loginCheck = npx supabase projects list 2>&1
if ($LASTEXITCODE -ne 0 -and $loginCheck -match "Access token not provided") {
  Write-Host @"

Not logged in. Use ONE of these:

A) Personal access token (no DB password):
   https://supabase.com/dashboard/account/tokens
   `$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
   node scripts/apply-migration-api.mjs

B) CLI login (browser opens):
   npx supabase login
   npx supabase link --project-ref $ProjectRef
   .\scripts\supabase-apply-auth-repair.ps1

"@ -ForegroundColor Yellow
  exit 1
}

Write-Host "Running migration against linked project…`n"
npx supabase db query --linked --file $Migration
if ($LASTEXITCODE -ne 0) {
  Write-Host "`nIf linking failed, run: npx supabase link --project-ref $ProjectRef" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host "`nDone. You should see 4 policies on profiles in the output above." -ForegroundColor Green
Write-Host @"

Next — update Auth URLs in the dashboard (cannot be scripted without extra API scope):
  https://supabase.com/dashboard/project/$ProjectRef/auth/url-configuration

Add these Redirect URLs:
  https://katanga-x.vercel.app/dashboard
  https://katanga-x.vercel.app/auth/reset-password
  http://localhost:3000/dashboard

Site URL (production):
  https://katanga-x.vercel.app

Providers:
  https://supabase.com/dashboard/project/$ProjectRef/auth/providers
  → Email ON, Confirm email ON, Phone OFF

"@ -ForegroundColor Cyan
