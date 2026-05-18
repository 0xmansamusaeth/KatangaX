"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getState, subscribe, updateState } from "@/lib/store";
import { getSeedState } from "@/lib/mockData";
import { getInitials } from "@/lib/utils";

export function useNotifications() {
  const [notifications, setNotifications] = useState(
    () => getSeedState().notifications,
  );

  useEffect(() => {
    setNotifications(getState().notifications);
    return subscribe(() => setNotifications(getState().notifications));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markRead = useCallback((id) => {
    updateState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  }, []);

  const markAllRead = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const removeNotification = useCallback((id) => {
    updateState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  /**
   * Accept a vault invitation notification: create a small starter vault
   * with the current user as the only confirmed member, then remove the
   * notification.
   * @param {string} notificationId
   */
  const acceptInvite = useCallback((notificationId) => {
    updateState((prev) => {
      const notif = prev.notifications.find((n) => n.id === notificationId);
      if (!notif) return prev;

      const user = prev.user;
      const vaultId = `vault-invite-${Date.now()}`;
      const inviteName =
        notif.body?.match(/“([^”]+)”/)?.[1] ??
        notif.body?.match(/"([^"]+)"/)?.[1] ??
        "Invited Vault";

      const creator = {
        id: `${vaultId}-u1`,
        userId: user.id,
        name: user.name,
        initials: getInitials(user.name),
        avatarColor: user.avatarColor ?? "#1B5E20",
        phone: user.phone,
        payoutOrder: 1,
        agreementAccepted: true,
      };

      const newVault = {
        id: vaultId,
        name: inviteName,
        description: notif.body ?? "",
        memberCount: 1,
        contributionAmount: 250,
        contributionPeriod: "month",
        currentRound: 1,
        totalRounds: 6,
        status: "active",
        startDate: new Date().toISOString().slice(0, 10),
        payoutOrderMethod: "fixed",
        createdBy: "Invitation",
        organiserId: creator.id,
        payoutRecipientMemberId: creator.id,
        members: [creator],
        contributionHistory: [],
        paymentStatusesByRound: { 1: { [creator.id]: "pending" } },
      };

      return {
        ...prev,
        vaults: [...prev.vaults, newVault],
        notifications: prev.notifications.filter(
          (n) => n.id !== notificationId,
        ),
      };
    });
  }, []);

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    removeNotification,
    acceptInvite,
  };
}
