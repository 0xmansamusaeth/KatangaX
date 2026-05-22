-- KatangaX auth-flow repair migration.
-- Fixes a "permission denied for table profiles" (Postgres code 42501) that
-- new users hit on /create-profile after email confirmation. Also relaxes
-- the original NOT NULL phone_number constraint, since email/password auth
-- replaced phone OTP and the phone field is now optional.
--
-- Safe to re-run. Run AFTER 003_beta_hardening.sql.

-- 0) Diagnostic: print currently-installed policies on `profiles` so you
--    can see the before/after state in the Supabase SQL editor output.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 1) Phone number is now optional (email/password is the primary auth).
--    Skipping this would crash both the "Continue" and "Skip for now"
--    handlers with NOT NULL violations (Postgres code 23502) whenever a
--    user doesn't enter a phone number.
ALTER TABLE profiles
  ALTER COLUMN phone_number DROP NOT NULL;

-- 2) Re-create the profiles RLS policies cleanly. We drop every name we
--    have ever shipped (under both the original migration names and the
--    "Users can …" names from the babysit script) so re-running this is
--    safe regardless of which set of policies the project currently has.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_anon" ON profiles;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Guests can view profiles" ON profiles;

-- Authenticated users can read any profile (needed for vault member
-- lookup, username uniqueness check, etc.).
CREATE POLICY "profiles_select_authenticated"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated user can INSERT only their own row. `auth.uid()` must
-- match the id we send from the client (which we do — the client passes
-- `id: session.user.id`).
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Authenticated user can only UPDATE their own row (and only into their
-- own row — both USING and WITH CHECK).
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Guests (anon role) can read profiles too — used by the public vault
-- registry and the read-only /vaults/[id] page when a not-signed-in
-- user is browsing the app.
CREATE POLICY "profiles_select_anon"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- 3) Sanity diagnostic: list policies again. After running this script
--    you should see four rows for `profiles`: three for authenticated
--    (SELECT/INSERT/UPDATE) and one for anon (SELECT).
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
