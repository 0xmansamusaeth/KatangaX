"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapNotificationRow } from "@/lib/supabase/mappers";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      setError(fetchErr.message);
      setNotifications([]);
    } else {
      setNotifications((data ?? []).map(mapNotificationRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const supabase = createClient();

    const setupChannel = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `profile_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [
              mapNotificationRow(payload.new),
              ...prev,
            ]);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    let cleanup;
    setupChannel().then((fn) => {
      cleanup = fn;
    });
    return () => cleanup?.();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (id) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("profile_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback(async (id) => {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const acceptInvite = useCallback(async (notification) => {
    const supabase = createClient();
    const inviteId = notification.inviteId ?? notification.metadata?.inviteId;
    if (!inviteId) {
      await markRead(notification.id);
      return;
    }
    await supabase
      .from("vault_invites")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", inviteId);
    await markRead(notification.id);
  }, [markRead]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refetch: fetchNotifications,
    markRead,
    markAllRead,
    removeNotification,
    acceptInvite,
  };
}
