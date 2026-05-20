"use client";

import { useProfile } from "@/hooks/useProfile";

/** @deprecated Use useProfile — kept for compatibility during migration */
export function useUser() {
  const { user, profile, loading, error, updateProfile, refetch } = useProfile();

  const updateUser = async (patch) => {
    return updateProfile({
      fullName: patch.name ?? patch.fullName,
      phoneNumber: patch.phone ?? patch.phoneNumber,
      avatarColor: patch.avatarColor,
      username: patch.username,
      walletAddress: patch.walletAddress,
    });
  };

  return {
    user: user ?? {
      id: "",
      name: "",
      phone: "",
      avatarColor: "#1B5E20",
      paymentMethods: [],
    },
    profile,
    loading,
    error,
    updateUser,
    refetch,
  };
}
