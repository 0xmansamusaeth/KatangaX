"use client";

import { useCallback, useEffect, useState } from "react";
import { getState, subscribe, updateState } from "@/lib/store";
import { getSeedState } from "@/lib/mockData";

export function useVaults() {
  // Initialize with seed only so SSR and the first client render match.
  // localStorage-merged state is applied after mount via useEffect below.
  const [vaults, setVaults] = useState(() => getSeedState().vaults);

  useEffect(() => {
    setVaults(getState().vaults);
    return subscribe(() => setVaults(getState().vaults));
  }, []);

  const updateVault = useCallback((vaultId, patch) => {
    updateState((prev) => ({
      ...prev,
      vaults: prev.vaults.map((v) =>
        v.id === vaultId
          ? typeof patch === "function"
            ? { ...v, ...patch(v) }
            : { ...v, ...patch }
          : v,
      ),
    }));
  }, []);

  const addVault = useCallback((vault) => {
    updateState((prev) => ({
      ...prev,
      vaults: [...prev.vaults, vault],
    }));
  }, []);

  const markContribution = useCallback(
    (vaultId, memberId, round, status = "paid") => {
      updateState((prev) => ({
        ...prev,
        vaults: prev.vaults.map((v) => {
          if (v.id !== vaultId) return v;
          const key = String(round);
          const prevMap = v.paymentStatusesByRound?.[key] ?? {};
          return {
            ...v,
            paymentStatusesByRound: {
              ...(v.paymentStatusesByRound ?? {}),
              [key]: { ...prevMap, [memberId]: status },
            },
          };
        }),
        payments: prev.payments.map((p) => {
          if (
            p.vaultId !== vaultId ||
            p.memberId !== memberId ||
            p.round !== round
          )
            return p;
          return {
            ...p,
            status,
            paidAt:
              status === "paid"
                ? new Date().toISOString().slice(0, 10)
                : p.paidAt,
          };
        }),
      }));
    },
    [],
  );

  const disbursePayout = useCallback((vaultId) => {
    updateState((prev) => ({
      ...prev,
      vaults: prev.vaults.map((v) => {
        if (v.id !== vaultId) return v;
        const nextRound = Math.min(v.totalRounds, v.currentRound + 1);
        const completed = nextRound >= v.totalRounds && v.currentRound + 1 > v.totalRounds;
        const nextStatus =
          v.currentRound >= v.totalRounds ? "completed" : v.status;
        const recipient =
          v.members?.find((m) => m.payoutOrder === nextRound) ?? null;
        return {
          ...v,
          currentRound: nextRound,
          status: nextStatus,
          payoutRecipientMemberId:
            recipient?.id ?? v.payoutRecipientMemberId ?? null,
        };
      }),
    }));
  }, []);

  const removeMember = useCallback((vaultId, memberId) => {
    updateState((prev) => ({
      ...prev,
      vaults: prev.vaults.map((v) => {
        if (v.id !== vaultId) return v;
        const filtered = (v.members ?? []).filter((m) => m.id !== memberId);
        return {
          ...v,
          members: filtered.map((m, i) => ({ ...m, payoutOrder: i + 1 })),
          memberCount: filtered.length,
        };
      }),
    }));
  }, []);

  const endVault = useCallback((vaultId) => {
    updateState((prev) => ({
      ...prev,
      vaults: prev.vaults.map((v) =>
        v.id === vaultId ? { ...v, status: "completed" } : v,
      ),
    }));
  }, []);

  return {
    vaults,
    updateVault,
    addVault,
    markContribution,
    disbursePayout,
    removeMember,
    endVault,
  };
}
