"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionStatus } from "@/components/web3/TransactionStatus";
import { useOnChainVaultData } from "@/lib/web3/hooks/useOnChainVaultData";
import { useMemberApprovals } from "@/lib/web3/hooks/useMemberApprovals";
import { useApproveDisbursement } from "@/lib/web3/hooks/useApproveDisbursement";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { basescanTxUrl } from "@/lib/web3/utils";
import { resolveMemberDisplay } from "@/lib/utils";

const MIN_APPROVALS = 3;

/**
 * @param {{ vault: any, user: any }} props
 */
export function Web3DisbursementPanel({ vault, user }) {
  const { address, isBase, isConnected } = useWalletConnection();
  const chain = useOnChainVaultData(vault.contractAddress);
  const { approvedByWallet, refetch: refetchApprovals } = useMemberApprovals(
    vault.contractAddress,
    vault.members,
  );
  const round = chain.currentRound ?? 1;
  const hash = chain.round?.disbursementHash;

  const {
    approve,
    status,
    txHash,
    error,
    isSuccess,
  } = useApproveDisbursement(vault.contractAddress, round, hash);

  const [celebrate, setCelebrate] = useState(false);
  const approvals = chain.roundApprovals ?? 0;
  const pct = Math.min(100, (approvals / MIN_APPROVALS) * 100);

  useEffect(() => {
    if (isSuccess) {
      chain.refetch();
      refetchApprovals();
      if (approvals + 1 >= MIN_APPROVALS) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 4000);
      }
    }
  }, [isSuccess, approvals, chain, refetchApprovals]);

  const disbursementReady =
    hash &&
    hash !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  if (!disbursementReady) return null;

  const recipientMember = vault.members?.find(
    (m) =>
      m.walletAddress?.toLowerCase() === chain.roundRecipient?.toLowerCase() ||
      m.payoutOrder === round,
  );
  const recipientName = recipientMember
    ? resolveMemberDisplay(recipientMember, user).name
    : "recipient";

  const web3Disabled = !isConnected || !isBase;

  return (
    <section className="space-y-3 rounded-2xl border border-[#FFC107]/40 bg-[#FFFBEB] p-4">
      <h3 className="text-sm font-semibold text-[#92400E]">
        Payout approval (on-chain)
      </h3>
      <p className="text-xs text-[#6B7280]">
        {approvals} of {MIN_APPROVALS} required approvals
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full bg-[#FFC107] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {vault.members?.map((m) => {
          const wallet = m.walletAddress?.toLowerCase();
          const approved =
            wallet && approvedByWallet.get(wallet) === true;
          const display = resolveMemberDisplay(m, user);
          const isYou = m.userId === user.id;
          const canSign =
            isYou &&
            address &&
            !chain.member?.approvedCurrentRound &&
            !web3Disabled;

          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                {approved ? (
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[#D1D5DB]" />
                )}
                {display.name}
                {isYou ? " (You)" : ""}
              </span>
              {canSign ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#FFC107] text-[#92400E]"
                  disabled={status === "pending"}
                  onClick={() => approve()}
                >
                  Sign to approve payout
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <TransactionStatus
        status={status}
        txHash={txHash}
        message="Submitting your signature on Base…"
        onRetry={() => approve()}
      />
      {error ? <p className="text-xs text-[#DC2626]">{error}</p> : null}

      {celebrate ? (
        <div className="rounded-xl bg-[#16A34A]/10 p-3 text-center text-sm font-semibold text-[#166534]">
          Payout sent to {recipientName}! 🎉
          {txHash ? (
            <Link
              href={basescanTxUrl(txHash) ?? "#"}
              className="mt-2 block text-xs text-[#1B5E20] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Basescan →
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
