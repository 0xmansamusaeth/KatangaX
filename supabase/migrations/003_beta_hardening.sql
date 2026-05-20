-- KatangaX beta hardening: feedback table, rate limits, abuse prevention.
-- Run after 002_notification_helpers.sql

-- 1) Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  category text CHECK (category IN ('bug', 'suggestion', 'compliment')),
  message text NOT NULL,
  page_url text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_self"
  ON feedback FOR INSERT TO authenticated
  WITH CHECK (profile_id IS NULL OR profile_id = auth.uid());

CREATE POLICY "feedback_select_self"
  ON feedback FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_feedback_profile_created
  ON feedback(profile_id, created_at DESC);

-- Helper RPC so the client always inserts as itself (no need to know id).
CREATE OR REPLACE FUNCTION submit_feedback(
  p_rating int,
  p_category text,
  p_message text,
  p_page_url text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF p_category NOT IN ('bug', 'suggestion', 'compliment') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  IF p_message IS NULL OR length(btrim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Message is required';
  END IF;

  INSERT INTO feedback (
    profile_id, rating, category, message, page_url, user_agent
  )
  VALUES (
    auth.uid(),
    p_rating,
    p_category,
    left(p_message, 2000),
    p_page_url,
    p_user_agent
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_feedback(int, text, text, text, text) TO authenticated;

-- 2) Vault creation cap: max 10 active vaults per organiser.
CREATE OR REPLACE FUNCTION enforce_vault_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  active_count int;
BEGIN
  IF NEW.organiser_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO active_count
    FROM vaults
   WHERE organiser_id = NEW.organiser_id
     AND status IN ('pending', 'active');
  IF active_count >= 10 THEN
    RAISE EXCEPTION 'Vault limit reached: max 10 active vaults per organiser';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_vault_limit ON vaults;
CREATE TRIGGER trg_enforce_vault_limit
  BEFORE INSERT ON vaults
  FOR EACH ROW
  EXECUTE FUNCTION enforce_vault_limit();

-- 3) Pending invite cap per vault: max 20.
CREATE OR REPLACE FUNCTION enforce_invite_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  pending_count int;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO pending_count
    FROM vault_invites
   WHERE vault_id = NEW.vault_id
     AND status = 'pending';
  IF pending_count >= 20 THEN
    RAISE EXCEPTION 'Invite limit reached: max 20 pending invites per vault';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_invite_limit ON vault_invites;
CREATE TRIGGER trg_enforce_invite_limit
  BEFORE INSERT ON vault_invites
  FOR EACH ROW
  EXECUTE FUNCTION enforce_invite_limit();

-- 4) Username changes: at most once every 30 days. We add a column so the
--    cooldown is independent of generic updated_at bumps.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;

CREATE OR REPLACE FUNCTION enforce_username_change_cooldown()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF OLD.username_changed_at IS NOT NULL
       AND OLD.username_changed_at > now() - interval '30 days' THEN
      RAISE EXCEPTION 'Username can only be changed once every 30 days';
    END IF;
    NEW.username_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_username_cooldown ON profiles;
CREATE TRIGGER trg_username_cooldown
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_username_change_cooldown();
