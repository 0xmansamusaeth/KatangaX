"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { encodeFunctionData } from "viem";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GasEstimateCard } from "@/components/web3/GasEstimateCard";
import { SignatureExplainerSheet } from "@/components/web3/SignatureExplainerSheet";
import { TransactionStatus } from "@/components/web3/TransactionStatus";
import { TxReviewCard } from "@/components/web3/TxReviewCard";
import { useOnChainVaultData } from "@/lib/web3/hooks/useOnChainVaultData";
import { useApproveDisbursement } from "@/lib/web3/hooks/useApproveDisbursement";
import { useGasEstimate } from "@/lib/web3/hooks/useGasEstimate";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { useProfile } from "@/hooks/useProfile";
import { useVaultRoundData } from "@/hooks/useVaultRoundData";
import { KATANGA_VAULT_ABI } from "@/lib/web3/contracts";
import { hasDismissedSignatureExplainer } from "@/lib/web3/web3Prefs";
import {
  basescanTxUrl,
  formatUsdc,
  truncateAddress,
} from "@/lib/web3/utils";
import { resolveMemberDisplay } from "@/lib/utils";
import { markDisbursed, recordSignature } from "@/lib/web3/roundMonitor";

const MIN_APPROVALS = 3;
const DUMMY_SIG =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

/**
 * @param {{ vault: any }} props
 */
export function DisbursementSection({ vault }) {
  const { profile } = useProfile();
  const { address, isBase, isConnected } = useWalletConnection();
  const chain = useOnChainVaultData(vault.contractAddress);

  const round = chain.currentRound ?? vault.currentRound ?? 1;
  const hash = chain.round?.disbursementHash;
  const disbursementReady =
    hash &&
    hash !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  const supabaseVaultId =
    typeof vault.id === "string" && vault.id.length === 36 ? vault.id : null;

  const {
    contributions,
    disbursement,
    signatures,
    refetch: refetchRound,
  } = useVaultRoundData(supabaseVaultId, round);

  const {
    approve,
    status,
    txHash,
    error,
    isSuccess,
  } = useApproveDisbursement(vault.contractAddress, round, hash);

  const [celebrate, setCelebrate] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const txData = useMemo(
    () =>
      encodeFunctionData({
        abi: KATANGA_VAULT_ABI,
        functionName: "approveDisbursement",
        args: [BigInt(round), DUMMY_SIG],
      }),
    [round],
  );

  const gas = useGasEstimate({
    enabled: Boolean(vault.contractAddress && hash),
    to: vault.contractAddress,
    data: txData,
  });

  const recipientMember = useMemo(() => {
    if (!vault.members?.length) return null;
    return (
      vault.members.find(
        (m) =>
          m.walletAddress?.toLowerCase() === chain.roundRecipient?.toLowerCase(),
      ) || vault.members.find((m) => m.payoutOrder === round) || null
    );
  }, [vault.members, chain.roundRecipient, round]);

  const recipientDisplay = recipientMember
    ? resolveMemberDisplay(recipientMember, profile ? { id: profile.id, name: profile.fullName } : undefined)
    : { name: "Recipient", initials: "?", avatarColor: "#6B7280" };

  const recipientName = recipientDisplay.name;
  const potAmount = chain.round?.amount ?? 0n;

  const memberCount = chain.memberCount ?? vault.memberCount ?? 0;
  const allMembersPaid = memberCount > 0 && contributions.length >= memberCount;

  const onChainSigCount = chain.round?.approvalCount ?? 0;
  const dbSigCount = signatures.length;
  const sigCount = Math.max(onChainSigCount, dbSigCount);

  const custodians = useMemo(
    () => (vault.members ?? []).filter((m) => m.isCustodian),
    [vault.members],
  );

  const youAreCustodian = Boolean(
    profile?.id && custodians.some((m) => m.userId === profile.id),
  );
  const youHaveSigned = Boolean(chain.member?.approvedCurrentRound);

  // Map signed wallets for the per-custodian list display.
  const signedWallets = useMemo(() => {
    const set = new Set();
    for (const s of signatures) {
      if (s.wallet_address) set.add(s.wallet_address.toLowerCase());
    }
    return set;
  }, [signatures]);

  useEffect(() => {
    if (!isSuccess || recorded) return;
    if (!txHash) return;
    setRecorded(true);

    (async () => {
      await chain.refetch();
      await refetchRound();

      if (disbursement?.id) {
        await recordSignature({
          disbursementId: disbursement.id,
          custodianProfileId: profile?.id,
          walletAddress: address,
          signature: txHash,
          vaultId: supabaseVaultId,
          signerName: profile?.fullName ?? "A custodian",
        }).catch(() => {});
      }

      // If this signature completed the 3-of-N threshold, the contract
      // auto-disburses. Record post-disbursement state in Supabase.
      const newSigCount = sigCount + 1;
      if (newSigCount >= MIN_APPROVALS) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 4000);

        if (supabaseVaultId && disbursement?.id) {
          const newRound = round + 1;
          const next = vault.members?.find((m) => m.payoutOrder === newRound);
          markDisbursed({
            disbursementId: disbursement.id,
            vaultId: supabaseVaultId,
            txHash,
            recipientName,
            amountLabel: formatUsdc(potAmount),
            newRound,
            totalRounds: vault.totalRounds,
            nextRecipientName: next?.name,
          }).catch(() => {});
        }
      }
    })();
  }, [
    isSuccess,
    recorded,
    txHash,
    chain,
    refetchRound,
    disbursement?.id,
    profile?.id,
    profile?.fullName,
    address,
    supabaseVaultId,
    sigCount,
    round,
    recipientName,
    potAmount,
    vault.members,
    vault.totalRounds,
  ]);

  const requestSign = () => {
    if (hasDismissedSignatureExplainer()) {
      approve();
      return;
    }
    setExplainerOpen(true);
  };

  if (!disbursementReady) return null;

  const web3Disabled = !isConnected || !isBase;

  return (
    <section className="space-y-3">
      <RecipientCard
        round={round}
        recipient={recipientDisplay}
        potAmount={potAmount}
        sigCount={sigCount}
        custodians={custodians}
        signedWallets={signedWallets}
        allMembersPaid={allMembersPaid || onChainSigCount > 0}
      />

      {youAreCustodian && !youHaveSigned ? (
        <CustodianActionCard
          vault={vault}
          round={round}
          recipientName={recipientName}
          potAmount={potAmount}
          gas={gas}
          status={status}
          web3Disabled={web3Disabled}
          onSign={requestSign}
        />
      ) : null}

      {youAreCustodian && youHaveSigned ? (
        <div className="rounded-2xl bg-[#16A34A]/10 p-3 text-sm font-medium text-[#166534]">
          ✅ You have signed. Waiting for {Math.max(0, MIN_APPROVALS - sigCount)} more signatures.
        </div>
      ) : null}

      <TransactionStatus
        status={status}
        txHash={txHash}
        message="Submitting your signature on Base…"
        onRetry={requestSign}
      />
      {error ? <p className="text-xs text-[#DC2626]">{error}</p> : null}

      {celebrate ? (
        <div className="rounded-xl bg-[#16A34A]/10 p-3 text-center text-sm font-semibold text-[#166534]">
          🎉 Payout sent to {recipientName}!
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

      <SignatureExplainerSheet
        open={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        onContinue={() => approve()}
        recipientName={recipientName}
        amount={potAmount}
      />
    </section>
  );
}

function RecipientCard({
  round,
  recipient,
  potAmount,
  sigCount,
  custodians,
  signedWallets,
  allMembersPaid,
}) {
  if (!allMembersPaid) return null;

  return (
    <div className="rounded-2xl border border-[#FFC107]/40 bg-gradient-to-br from-[#FFFBEB] to-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#92400E]">
        💰 Round {round} Complete!
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: recipient.avatarColor }}
        >
          {recipient.initials}
        </div>
        <div>
          <p className="text-xs text-[#6B7280]">Payout recipient</p>
          <p className="text-base font-semibold text-[#1A1A1A]">
            {recipient.name}
          </p>
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-[#1A1A1A]">
        {formatUsdc(potAmount)}
      </p>
      <p className="text-xs text-[#6B7280]">
        {Math.min(sigCount, MIN_APPROVALS)} of {MIN_APPROVALS} custodian signatures collected
      </p>

      <ul className="mt-3 space-y-2">
        {custodians.slice(0, MIN_APPROVALS).map((c, i) => {
          const signed = c.walletAddress
            ? signedWallets.has(c.walletAddress.toLowerCase())
            : i < sigCount;
          return (
            <li
              key={c.id ?? i}
              className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-xs"
            >
              {signed ? (
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
              ) : (
                <span className="h-3 w-3 rounded-full bg-[#D1D5DB]" />
              )}
              <span className="flex-1 font-medium text-[#1A1A1A]">
                {c.name}
              </span>
              <span className="font-mono text-[10px] text-[#6B7280]">
                {signed
                  ? truncateAddress(c.walletAddress)
                  : "Awaiting signature"}
              </span>
            </li>
          );
        })}
        {custodians.length < MIN_APPROVALS ? (
          <li className="rounded-lg bg-white px-3 py-2 text-xs text-[#6B7280]">
            {MIN_APPROVALS - custodians.length} custodian slot(s) unassigned
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function CustodianActionCard({
  vault,
  round,
  recipientName,
  potAmount,
  gas,
  status,
  web3Disabled,
  onSign,
}) {
  return (
    <div className="rounded-2xl border-2 border-[#FFC107] bg-[#FFFBEB] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#92400E]">
        <ShieldCheck className="h-5 w-5" />
        🔐 Your signature is required
      </div>
      <p className="mt-2 text-sm text-[#4B5563]">
        You are a custodian of this vault. Sign to approve the payout of{" "}
        {formatUsdc(potAmount)} to{" "}
        <span className="font-semibold text-[#1A1A1A]">{recipientName}</span>.
      </p>

      <dl className="mt-3 space-y-1.5 rounded-xl bg-white p-3 text-xs">
        <Row label="Vault" value={vault.name} />
        <Row label="Round" value={String(round)} />
        <Row label="Recipient" value={recipientName} />
        <Row label="Amount" value={formatUsdc(potAmount)} highlight />
      </dl>

      <div className="mt-3">
        <TxReviewCard
          action="Sign payout approval"
          vaultName={vault.name}
          amountLabel={formatUsdc(potAmount)}
          gasFormatted={gas.formatted}
        />
        <div className="mt-2">
          <GasEstimateCard
            formatted={gas.formatted}
            isLoading={gas.isLoading}
            hasInsufficientEth={gas.hasInsufficientEth}
          />
        </div>
      </div>

      <Button
        type="button"
        className="mt-4 w-full bg-[#FFC107] text-[#1A1A1A] hover:bg-[#F0B400]"
        size="lg"
        disabled={web3Disabled || status === "pending"}
        onClick={() => {
          if (web3Disabled) {
            toast("Connect to Base mainnet first", { variant: "error" });
            return;
          }
          onSign();
        }}
      >
        {status === "pending"
          ? "Check your wallet…"
          : "Sign to Approve Payout"}
      </Button>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd
        className={
          "text-right font-medium " +
          (highlight ? "text-[#1B5E20]" : "text-[#1A1A1A]")
        }
      >
        {value}
      </dd>
    </div>
  );
}
