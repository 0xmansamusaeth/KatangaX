-- KatangaX initial schema — run in Supabase SQL Editor

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_color text DEFAULT '#1B5E20',
  wallet_address text UNIQUE,
  is_custodian_eligible boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT username_format CHECK (
    username ~ '^[a-z0-9_]{3,20}$'
  )
);

-- vaults
CREATE TABLE IF NOT EXISTS vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address text UNIQUE NOT NULL,
  name text NOT NULL,
  organiser_id uuid REFERENCES profiles(id),
  contribution_amount numeric(18,6) NOT NULL,
  frequency text CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  total_members int NOT NULL,
  current_round int DEFAULT 1,
  total_rounds int NOT NULL,
  round_deadline timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  payout_order text DEFAULT 'fixed' CHECK (payout_order IN ('fixed', 'random', 'bidding')),
  rules text,
  payment_method text DEFAULT 'usdc',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid REFERENCES vaults(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id),
  wallet_address text NOT NULL,
  payout_order int NOT NULL,
  is_custodian boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(vault_id, profile_id),
  UNIQUE(vault_id, payout_order)
);

CREATE TABLE IF NOT EXISTS vault_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid REFERENCES vaults(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES profiles(id),
  invitee_profile_id uuid REFERENCES profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid REFERENCES vaults(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id),
  round_number int NOT NULL,
  amount numeric(18,6) NOT NULL,
  tx_hash text UNIQUE NOT NULL,
  status text DEFAULT 'confirmed',
  contributed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid REFERENCES vaults(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  recipient_id uuid REFERENCES profiles(id),
  amount numeric(18,6) NOT NULL,
  tx_hash text UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed')),
  created_at timestamptz DEFAULT now(),
  disbursed_at timestamptz
);

CREATE TABLE IF NOT EXISTS disbursement_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disbursement_id uuid REFERENCES disbursements(id) ON DELETE CASCADE,
  custodian_id uuid REFERENCES profiles(id),
  wallet_address text NOT NULL,
  signature text NOT NULL,
  signed_at timestamptz DEFAULT now(),
  UNIQUE(disbursement_id, custodian_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  vault_id uuid REFERENCES vaults(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS vaults_updated_at ON vaults;
CREATE TRIGGER vaults_updated_at
  BEFORE UPDATE ON vaults FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursement_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- vaults: members can read
CREATE POLICY "vaults_select_members"
  ON vaults FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vault_members vm
      WHERE vm.vault_id = vaults.id AND vm.profile_id = auth.uid()
    )
    OR organiser_id = auth.uid()
  );

CREATE POLICY "vaults_insert_authenticated"
  ON vaults FOR INSERT TO authenticated WITH CHECK (organiser_id = auth.uid());

CREATE POLICY "vaults_update_organiser"
  ON vaults FOR UPDATE TO authenticated
  USING (organiser_id = auth.uid());

-- vault_members
CREATE POLICY "vault_members_select"
  ON vault_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vault_members vm2
      WHERE vm2.vault_id = vault_members.vault_id AND vm2.profile_id = auth.uid()
    )
  );

CREATE POLICY "vault_members_insert_organiser"
  ON vault_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vaults v
      WHERE v.id = vault_id AND v.organiser_id = auth.uid()
    )
  );

-- vault_invites
CREATE POLICY "vault_invites_select"
  ON vault_invites FOR SELECT TO authenticated
  USING (invited_by = auth.uid() OR invitee_profile_id = auth.uid());

CREATE POLICY "vault_invites_insert_organiser"
  ON vault_invites FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vaults v WHERE v.id = vault_id AND v.organiser_id = auth.uid()
    )
  );

CREATE POLICY "vault_invites_update_invitee"
  ON vault_invites FOR UPDATE TO authenticated
  USING (invitee_profile_id = auth.uid());

-- contributions
CREATE POLICY "contributions_select_members"
  ON contributions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vault_members vm
      WHERE vm.vault_id = contributions.vault_id AND vm.profile_id = auth.uid()
    )
  );

CREATE POLICY "contributions_insert_member"
  ON contributions FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM vault_members vm
      WHERE vm.vault_id = contributions.vault_id AND vm.profile_id = auth.uid()
    )
  );

-- disbursements
CREATE POLICY "disbursements_select_members"
  ON disbursements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vault_members vm
      WHERE vm.vault_id = disbursements.vault_id AND vm.profile_id = auth.uid()
    )
  );

CREATE POLICY "disbursements_insert_organiser"
  ON disbursements FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vaults v
      WHERE v.id = vault_id AND v.organiser_id = auth.uid()
    )
  );

-- disbursement_signatures
CREATE POLICY "disbursement_sigs_select"
  ON disbursement_signatures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disbursements d
      JOIN vault_members vm ON vm.vault_id = d.vault_id
      WHERE d.id = disbursement_id AND vm.profile_id = auth.uid()
    )
  );

CREATE POLICY "disbursement_sigs_insert_custodian"
  ON disbursement_signatures FOR INSERT TO authenticated
  WITH CHECK (custodian_id = auth.uid());

-- notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

-- Database functions
CREATE OR REPLACE FUNCTION get_vault_with_members(vault_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'vault', row_to_json(v.*),
    'members', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'member', row_to_json(vm.*),
            'profile', row_to_json(p.*)
          )
          ORDER BY vm.payout_order
        )
        FROM vault_members vm
        LEFT JOIN profiles p ON p.id = vm.profile_id
        WHERE vm.vault_id = vault_uuid
      ),
      '[]'::json
    )
  )
  INTO result
  FROM vaults v
  WHERE v.id = vault_uuid;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_vaults(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'vault', row_to_json(v.*),
          'member_count', (
            SELECT count(*)::int FROM vault_members vm WHERE vm.vault_id = v.id
          ),
          'my_payout_order', vm.payout_order,
          'is_organiser', (v.organiser_id = user_uuid)
        )
        ORDER BY v.created_at DESC
      )
      FROM vault_members vm
      JOIN vaults v ON v.id = vm.vault_id
      WHERE vm.profile_id = user_uuid
    ),
    '[]'::json
  );
END;
$$;

CREATE OR REPLACE FUNCTION search_profiles_by_username(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'username', p.username,
          'avatar_color', p.avatar_color,
          'wallet_address', p.wallet_address
        )
      )
      FROM profiles p
      WHERE p.username ILIKE '%' || query || '%'
        AND p.id <> auth.uid()
      LIMIT 20
    ),
    '[]'::json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_vault_with_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vaults(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_profiles_by_username(text) TO authenticated;
