"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { listPendingTx, removePendingTx, removePendingByTxHash } from "@/lib/web3/pendingTx";
import { basescanTxUrl } from "@/lib/web3/utils";

const POLL_MS = 8000;
const STALE_MS = 30 * 60 * 1000;

/**
 * Background monitor — on mount, look up any pending txs the user kicked
 * off in this session and reconcile them with the chain. Shows a compact
 * floating banner the user can interact with.
 */
export function TransactionRecovery() {
  const [pending, setPending] = useState([]);
  const [statuses, setStatuses] = useState({});

  const refresh = useCallback(() => {
    setPending(listPendingTx());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  useEffect(() => {
    if (pending.length === 0) return undefined;

    let cancelled = false;

    const checkOne = async (tx) => {
      try {
        const [{ getTransactionReceipt }, { wagmiConfig }] = await Promise.all([
          import("wagmi/actions"),
          import("@/lib/web3/config"),
        ]);
        const receipt = await getTransactionReceipt(wagmiConfig, {
          hash: tx.txHash,
        });
        if (cancelled) return;

        if (receipt?.status === "success") {
          setStatuses((prev) => ({ ...prev, [tx.key]: "success" }));
          removePendingTx(tx.key);
          toast("Transaction confirmed", { variant: "success" });
          refresh();
        } else if (receipt?.status === "reverted") {
          setStatuses((prev) => ({ ...prev, [tx.key]: "reverted" }));
        } else {
          // Pending / unknown — leave alone unless older than STALE_MS.
          if (Date.now() - tx.startedAt > STALE_MS) {
            setStatuses((prev) => ({ ...prev, [tx.key]: "dropped" }));
          } else {
            setStatuses((prev) => ({ ...prev, [tx.key]: "pending" }));
          }
        }
      } catch (e) {
        if (cancelled) return;
        const msg = String(e?.message ?? e ?? "").toLowerCase();
        if (msg.includes("not found") || msg.includes("could not be found")) {
          if (Date.now() - tx.startedAt > STALE_MS) {
            setStatuses((prev) => ({ ...prev, [tx.key]: "dropped" }));
          } else {
            setStatuses((prev) => ({ ...prev, [tx.key]: "pending" }));
          }
        } else {
          setStatuses((prev) => ({ ...prev, [tx.key]: "pending" }));
        }
      }
    };

    const run = () => pending.forEach(checkOne);
    run();
    const id = window.setInterval(run, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pending, refresh]);

  const visible = pending.filter((tx) => {
    const s = statuses[tx.key];
    return s !== "success";
  });

  if (visible.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-[70] flex justify-center px-3">
      <div className="mx-auto w-full max-w-[430px] space-y-2">
        {visible.map((tx) => (
          <PendingRow
            key={tx.key}
            tx={tx}
            status={statuses[tx.key] ?? "pending"}
            onDismiss={() => {
              removePendingByTxHash(tx.txHash);
              refresh();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PendingRow({ tx, status, onDismiss }) {
  const url = basescanTxUrl(tx.txHash);

  const meta = METAS[status] ?? METAS.pending;
  const Icon = meta.Icon;

  return (
    <div
      className={
        "flex items-start gap-3 rounded-2xl border bg-white p-3 text-xs shadow-md " +
        meta.border
      }
    >
      <div className={"mt-0.5 flex h-8 w-8 items-center justify-center rounded-full " + meta.wrap}>
        <Icon className={"h-4 w-4 " + (status === "pending" ? "animate-spin" : "")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#1A1A1A]">{meta.title(tx.action)}</p>
        <p className="text-[11px] text-[#6B7280]">{meta.body}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {url ? (
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-[#1B5E20] underline"
            >
              View on Basescan
            </Link>
          ) : null}
          {status !== "pending" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const METAS = {
  pending: {
    Icon: Loader2,
    wrap: "bg-[#1B5E20]/10 text-[#1B5E20]",
    border: "border-[#1B5E20]/20",
    title: (a) =>
      a === "approve"
        ? "Approving USDC…"
        : a === "sign_disbursement"
          ? "Signing on-chain…"
          : "Sending contribution…",
    body: "Waiting for Base to confirm. Safe to keep using the app.",
  },
  reverted: {
    Icon: XCircle,
    wrap: "bg-[#DC2626]/10 text-[#DC2626]",
    border: "border-[#DC2626]/30",
    title: () => "Transaction reverted",
    body: "The transaction was included but failed. Tap retry from the original screen.",
  },
  dropped: {
    Icon: AlertTriangle,
    wrap: "bg-[#FFC107]/15 text-[#92400E]",
    border: "border-[#FFC107]/40",
    title: () => "Transaction may have been dropped",
    body: "We couldn't find it on Base. Try again or check Basescan.",
  },
  success: {
    Icon: CheckCircle2,
    wrap: "bg-[#16A34A]/10 text-[#166534]",
    border: "border-[#16A34A]/30",
    title: () => "Transaction confirmed",
    body: "Your transaction was confirmed.",
  },
};
