# Supabase auth setup (one-time)

Project ref: `tpjytzdwuaqveugefxwp`

## Option A — CLI (recommended, ~2 minutes)

```powershell
cd C:\Users\HP\OneDrive\Documents\KatangaX

# 1) Log in (browser opens)
npx supabase login

# 2) Link project (paste DB password from dashboard → Settings → Database)
npx supabase link --project-ref tpjytzdwuaqveugefxwp

# 3) Apply migration + verify policies in output
.\scripts\supabase-apply-auth-repair.ps1
```

Expected policy list after step 3:

| policyname | cmd | roles |
| --- | --- | --- |
| profiles_insert_own | INSERT | authenticated |
| profiles_select_anon | SELECT | anon |
| profiles_select_authenticated | SELECT | authenticated |
| profiles_update_own | UPDATE | authenticated |

## Option B — SQL Editor (no CLI)

1. Open [SQL Editor → New query](https://supabase.com/dashboard/project/tpjytzdwuaqveugefxwp/sql/new)
2. Paste the full contents of `supabase/migrations/004_auth_flow_repair.sql`
3. Click **Run**
4. Confirm the second `SELECT` at the bottom returns **4 rows** for `profiles`

## Auth URL configuration

Open [URL Configuration](https://supabase.com/dashboard/project/tpjytzdwuaqveugefxwp/auth/url-configuration):

| Field | Value |
| --- | --- |
| **Site URL** | `https://katanga-x.vercel.app` |
| **Redirect URLs** (add each) | `https://katanga-x.vercel.app/dashboard` |
| | `https://katanga-x.vercel.app/auth/reset-password` |
| | `http://localhost:3000/dashboard` |

## Providers

Open [Providers](https://supabase.com/dashboard/project/tpjytzdwuaqveugefxwp/auth/providers):

- **Email** — enabled
- **Confirm email** — enabled
- **Phone** — disabled
- OAuth providers — all disabled (unless you add them later)

## Verify profile creation

1. Sign up at https://katanga-x.vercel.app/auth?tab=signup
2. Confirm email → land on `/dashboard` → redirect to `/create-profile`
3. Submit profile → no `permission denied` error
4. Check [profiles table](https://supabase.com/dashboard/project/tpjytzdwuaqveugefxwp/editor/17441?schema=public) (Table Editor → profiles)
