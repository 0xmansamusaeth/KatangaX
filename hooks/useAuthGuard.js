"use client";

import { useCallback } from "react";
import { useAuthContext } from "@/components/auth/AuthContext";

/**
 * Hook used by any protected button/link in the app.
 *
 * Usage:
 *   const { requireAuth } = useAuthGuard()
 *   <button onClick={() => requireAuth('create_vault', () => router.push('/vaults/new'))}>
 *     Create a Vault
 *   </button>
 *
 * Behaviour:
 *  - If user is already authenticated → run the callback immediately.
 *  - Otherwise → open the AuthPromptModal with the provided action key.
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading, openPrompt, user } = useAuthContext();

  const requireAuth = useCallback(
    (action, callback) => {
      if (isAuthenticated) {
        callback?.();
        return true;
      }
      openPrompt(action ?? "default");
      return false;
    },
    [isAuthenticated, openPrompt],
  );

  return {
    requireAuth,
    isAuthenticated,
    isLoading,
    user,
  };
}
