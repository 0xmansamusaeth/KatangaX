"use client";

import { useCallback, useEffect, useState } from "react";
import { getState, subscribe, updateState } from "@/lib/store";
import { getSeedState } from "@/lib/mockData";

export function useUser() {
  const [user, setUser] = useState(() => getSeedState().user);

  useEffect(() => {
    setUser(getState().user);
    return subscribe(() => setUser(getState().user));
  }, []);

  const updateUser = useCallback((patch) => {
    updateState((prev) => ({
      ...prev,
      user: { ...prev.user, ...patch },
    }));
  }, []);

  return { user, updateUser };
}
