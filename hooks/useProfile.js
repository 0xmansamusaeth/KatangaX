"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapProfileRow, profileToUser } from "@/lib/supabase/mappers";
import { checksumAddress } from "@/lib/web3/utils";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      setProfile(null);
      setLoading(false);
      return null;
    }

    const { data, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      setError(profileErr.message);
      setProfile(null);
    } else {
      setProfile(mapProfileRow(data));
    }
    setLoading(false);
    return mapProfileRow(data);
  }, []);

  useEffect(() => {
    fetchProfile();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (patch) => {
      if (!profile?.id) return { error: "Not signed in" };
      const supabase = createClient();
      const dbPatch = {};
      if (patch.fullName != null) dbPatch.full_name = patch.fullName;
      if (patch.full_name != null) dbPatch.full_name = patch.full_name;
      if (patch.phoneNumber != null) dbPatch.phone_number = patch.phoneNumber;
      if (patch.username != null) dbPatch.username = patch.username;
      if (patch.avatarColor != null) dbPatch.avatar_color = patch.avatarColor;
      if (patch.walletAddress != null) {
        const normalized = checksumAddress(patch.walletAddress);
        if (!normalized && patch.walletAddress !== "") {
          return { error: "Invalid wallet address" };
        }
        dbPatch.wallet_address = normalized;
      }
      if (patch.isCustodianEligible != null) {
        dbPatch.is_custodian_eligible = patch.isCustodianEligible;
      }

      const { data, error: updateErr } = await supabase
        .from("profiles")
        .update(dbPatch)
        .eq("id", profile.id)
        .select()
        .single();

      if (updateErr) return { error: updateErr.message };
      const mapped = mapProfileRow(data);
      setProfile(mapped);
      return { data: mapped };
    },
    [profile?.id],
  );

  const user = profileToUser(profile);

  return {
    profile,
    user,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
