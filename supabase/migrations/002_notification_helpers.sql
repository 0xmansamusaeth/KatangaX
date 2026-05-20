-- Notification helpers + custodian flag + auxiliary indexes
-- Run after 001_initial_schema.sql

-- Notifications: allow vault members to insert into any other member's
-- notification stream for the same vault (used by frontend after on-chain
-- events succeed). Service role still bypasses RLS for system jobs.
CREATE POLICY "notifications_insert_vault_member"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    vault_id IS NULL
    OR EXISTS (
      SELECT 1 FROM vault_members vm
      WHERE vm.vault_id = notifications.vault_id
        AND vm.profile_id = auth.uid()
    )
  );

-- Vault members: allow members to see vaults via vault_members SELECT
-- (already covered) and allow custodian flag updates by organiser.
CREATE POLICY "vault_members_update_organiser"
  ON vault_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vaults v
      WHERE v.id = vault_members.vault_id AND v.organiser_id = auth.uid()
    )
  );

-- Allow custodians to update disbursements they sign for
CREATE POLICY "disbursements_update_custodian"
  ON disbursements FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vault_members vm
      WHERE vm.vault_id = disbursements.vault_id
        AND vm.profile_id = auth.uid()
        AND vm.is_custodian = true
    )
  );

-- Helper: notify every member of a vault (optionally excluding one)
CREATE OR REPLACE FUNCTION notify_vault_members(
  p_vault_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_exclude_profile_id uuid DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count int := 0;
BEGIN
  -- Only allow if caller is a member of this vault
  IF NOT EXISTS (
    SELECT 1 FROM vault_members
    WHERE vault_id = p_vault_id AND profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorised for this vault';
  END IF;

  INSERT INTO notifications (profile_id, type, title, message, vault_id)
  SELECT vm.profile_id, p_type, p_title, p_message, p_vault_id
    FROM vault_members vm
   WHERE vm.vault_id = p_vault_id
     AND (p_exclude_profile_id IS NULL OR vm.profile_id <> p_exclude_profile_id)
     AND vm.profile_id IS NOT NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- Helper: notify custodians of a vault only
CREATE OR REPLACE FUNCTION notify_vault_custodians(
  p_vault_id uuid,
  p_type text,
  p_title text,
  p_message text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault_members
    WHERE vault_id = p_vault_id AND profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorised for this vault';
  END IF;

  INSERT INTO notifications (profile_id, type, title, message, vault_id)
  SELECT vm.profile_id, p_type, p_title, p_message, p_vault_id
    FROM vault_members vm
   WHERE vm.vault_id = p_vault_id
     AND vm.is_custodian = true
     AND vm.profile_id IS NOT NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- Helper: notify a single profile
CREATE OR REPLACE FUNCTION notify_profile(
  p_profile_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_vault_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_vault_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM vault_members
    WHERE vault_id = p_vault_id AND profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorised for this vault';
  END IF;

  INSERT INTO notifications (profile_id, type, title, message, vault_id)
  VALUES (p_profile_id, p_type, p_title, p_message, p_vault_id)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Helper: lookup vault row by on-chain contract address.
-- Case-insensitive so callers can pass any casing (lower, upper, checksum).
CREATE OR REPLACE FUNCTION get_vault_by_contract(p_contract_address text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
    FROM vaults
   WHERE lower(contract_address) = lower(p_contract_address)
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION notify_vault_members(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_vault_custodians(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_profile(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vault_by_contract(text) TO authenticated;

-- Indexes for hot queries
CREATE INDEX IF NOT EXISTS idx_contributions_vault_round
  ON contributions(vault_id, round_number);
CREATE INDEX IF NOT EXISTS idx_contributions_profile
  ON contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_vault
  ON disbursements(vault_id, round_number);
CREATE INDEX IF NOT EXISTS idx_disbursement_sigs_disbursement
  ON disbursement_signatures(disbursement_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_created
  ON notifications(profile_id, created_at DESC);

-- Case-insensitive uniqueness + lookup indexes for on-chain addresses.
-- Postgres `text UNIQUE` is binary, so two casings of the same address would
-- otherwise both be allowed. These functional indexes keep one row per
-- address regardless of casing, and back the lower()=lower() comparisons
-- used by get_vault_by_contract / wallet lookups.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vaults_contract_address_lower
  ON vaults(lower(contract_address));
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_wallet_address_lower
  ON profiles(lower(wallet_address))
  WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_members_wallet_lower
  ON vault_members(lower(wallet_address));
