"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getState, subscribe, updateState } from "@/lib/store";
import { getSeedState } from "@/lib/mockData";

export function usePayments() {
  const [payments, setPayments] = useState(() => getSeedState().payments);

  useEffect(() => {
    setPayments(getState().payments);
    return subscribe(() => setPayments(getState().payments));
  }, []);

  const updatePayment = useCallback((paymentId, patch) => {
    updateState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === paymentId ? { ...p, ...patch } : p,
      ),
    }));
  }, []);

  const summary = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid").length;
    const pending = payments.filter((p) => p.status === "pending").length;
    const late = payments.filter((p) => p.status === "late").length;
    return { paid, pending, late, total: payments.length };
  }, [payments]);

  return { payments, updatePayment, summary };
}
