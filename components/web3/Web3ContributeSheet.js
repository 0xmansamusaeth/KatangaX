"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { encodeFunctionData } from "viem";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GasEstimateCard } from "@/components/web3/GasEstimateCard";
import { TransactionStatus } from "@/components/web3/TransactionStatus";
import { TxReviewCard } from "@/components/web3/TxReviewCard";
import { UsdcOnrampSheet } from "@/components/web3/UsdcOnrampSheet";
import { useContribute } from "@/lib/web3/hooks/useContribute";
import { useGasEstimate } from "@/lib/web3/hooks/useGasEstimate";
import { useUSDCAllowance } from "@/lib/web3/hooks/useUSDCAllowance";
import { useUSDCBalance } from "@/lib/web3/hooks/useUSDCBalance";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import { useOnChainVaultData } from "@/lib/web3/hooks/useOnChainVaultData";
import {
  KATANGA_VAULT_ABI,
  USDC_ABI,
  USDC_ADDRESS,
} from "@/lib/web3/contracts";
import {
  basescanAddressUrl,
  basescanTxUrl,
  formatUsdc,
  parseUsdc,
  truncateAddress,
} from "@/lib/web3/utils";
import { recordContribution, checkAndProgressRound } from "@/lib/web3/roundMonitor";
import { useProfile } from "@/hooks/useProfile";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   vault: any,
 *   onSuccess?: (txHash: string) => void,
 * }} props
 */
export function Web3ContributeSheet({ open, onClose, vault, onSuccess }) {
  const { profile } = useProfile();
  const { isConnected, isBase, address } = useWalletConnection();
  const { balance: usdcBalance } = useUSDCBalance();
  const { allowance } = useUSDCAllowance(vault.contractAddress);
  const chain = useOnChainVaultData(vault.contractAddress);
  const [onrampOpen, setOnrampOpen] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const amount = useMemo(
    () => parseUsdc(String(vault.contributionAmount ?? 0)),
    [vault.contributionAmount],
  );

  const {
    step,
    status,
    txHash,
    error,
    approve,
    contribute,
    reset,
    isConfirming,
    isSuccess,
  } = useContribute(vault.contractAddress, amount);

  const profileWallet = profile?.walletAddress;
  const sameWallet =
    profileWallet && address &&
    profileWallet.toLowerCase() === address.toLowerCase();

  const isMember = vault.members?.some(
    (m) =>
      m.userId === profile?.id ||
      (m.walletAddress && m.walletAddress.toLowerCase() === address?.toLowerCase()),
  );

  const paidOnChain = Boolean(chain.member?.paidThisRound);
  const insufficientUsdc = usdcBalance != null && usdcBalance < amount;
  const needsApproval = (allowance ?? 0n) < amount;
  const custodianCount = (vault.members ?? []).filter((m) => m.isCustodian).length;
  const custodiansAssigned = custodianCount === 0 ? true : custodianCount >= 3;

  const blocker = useMemo(() => {
    if (!profileWallet) {
      return {
        title: "No wallet on profile",
        body: "Connect a wallet to your profile before contributing.",
        cta: { label: "Connect wallet", href: "/connect-wallet" },
      };
    }
    if (!isConnected) {
      return {
        title: "Wallet not connected",
        body: "Open your wallet and reconnect to KatangaX.",
      };
    }
    if (!sameWallet) {
      return {
        title: "Wrong wallet connected",
        body: `Connected wallet doesn't match your profile wallet. Please connect ${truncateAddress(profileWallet)}.`,
      };
    }
    if (!isBase) {
      return {
        title: "Switch to Base mainnet",
        body: "This vault lives on Base. Switch networks in your wallet to continue.",
      };
    }
    if (!isMember) {
      return {
        title: "Not a vault member",
        body: "Only invited members can contribute to this vault.",
      };
    }
    if (paidOnChain) {
      return {
        title: "Already paid this round",
        body: `You've already contributed for round ${vault.currentRound}.`,
      };
    }
    if (!custodiansAssigned) {
      return {
        title: "Custodians not yet assigned",
        body: "The organiser must finish vault setup before contributions can be made.",
      };
    }
    if (insufficientUsdc) {
      return {
        title: "Insufficient USDC",
        body: `You need ${formatUsdc(amount)} to contribute. Add funds and try again.`,
        cta: { label: "Get USDC", onClick: () => setOnrampOpen(true) },
      };
    }
    return null;
  }, [
    profileWallet,
    isConnected,
    sameWallet,
    isBase,
    isMember,
    paidOnChain,
    custodiansAssigned,
    insufficientUsdc,
    amount,
    vault.currentRound,
  ]);

  const uiStep = needsApproval && step !== "approved" ? "approve" : "contribute";

  const txData = useMemo(() => {
    if (!address) return undefined;
    if (uiStep === "approve") {
      return encodeFunctionData({
        abi: USDC_ABI,
        functionName: "approve",
        args: [vault.contractAddress, amount],
      });
    }
    return encodeFunctionData({
      abi: KATANGA_VAULT_ABI,
      functionName: "contribute",
    });
  }, [address, uiStep, vault.contractAddress, amount]);

  const gas = useGasEstimate({
    enabled: open && isConnected && isBase && !blocker,
    to: uiStep === "approve" ? USDC_ADDRESS : vault.contractAddress,
    data: txData,
  });

  useEffect(() => {
    if (!open) setRecorded(false);
  }, [open]);

  useEffect(() => {
    if (!isSuccess || step !== "success" || recorded) return;
    if (!txHash || !profile?.id) return;

    (async () => {
      setRecorded(true);
      const recordRes = await recordContribution({
        contractAddress: vault.contractAddress,
        vaultId: vault.id?.length === 36 ? vault.id : undefined,
        profileId: profile.id,
        roundNumber: vault.currentRound,
        amount: Number(vault.contributionAmount),
        txHash,
        contributorName: profile.fullName ?? "A member",
      });

      const resolvedVaultId = recordRes?.vaultId;

      await chain.refetch();

      checkAndProgressRound({
        contractAddress: vault.contractAddress,
        roundNumber: vault.currentRound,
        recipientWalletAddress: chain.roundRecipient,
        recipientName: vault.members?.find(
          (m) => m.walletAddress?.toLowerCase() === chain.roundRecipient?.toLowerCase(),
        )?.name,
        potAmount: chain.round?.amount ?? 0n,
        memberCount: vault.memberCount ?? chain.memberCount,
        contributionAmount: chain.contributionAmount ?? amount,
      }).catch(() => {});

      onSuccess?.(txHash, resolvedVaultId);
    })();
  }, [
    isSuccess,
    step,
    recorded,
    txHash,
    profile?.id,
    profile?.fullName,
    vault,
    chain,
    amount,
    onSuccess,
  ]);

  const handlePrimary = async () => {
    try {
      if (uiStep === "approve") {
        await approve();
      } else {
        await contribute();
      }
    } catch {
      /* errors surfaced via toast inside hook */
    }
  };

  const paidCount = (chain.contributionAmount && chain.memberCount && chain.member)
    ? // best-effort: read from on-chain round info if exposed; otherwise hide
      chain.round?.paidMembers ?? null
    : null;

  if (blocker) {
    return (
      <BottomSheet open={open} onClose={onClose} title="Cannot contribute">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
            <div className="text-sm">
              <p className="font-semibold text-[#991B1B]">{blocker.title}</p>
              <p className="mt-1 text-[#4B5563]">{blocker.body}</p>
            </div>
          </div>
          {blocker.cta ? (
            blocker.cta.href ? (
              <Button asChild className="w-full" size="lg">
                <Link href={blocker.cta.href}>{blocker.cta.label}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={blocker.cta.onClick}
              >
                {blocker.cta.label}
              </Button>
            )
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
          <UsdcOnrampSheet
            open={onrampOpen}
            onClose={() => setOnrampOpen(false)}
            walletAddress={address}
          />
        </div>
      </BottomSheet>
    );
  }

  if (status === "success" && step === "success") {
    return (
      <BottomSheet open={open} onClose={onClose} title="Contribution confirmed">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16A34A]/15 text-[#16A34A]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[#1A1A1A]">
            ✅ Contribution confirmed!
          </h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            {formatUsdc(amount)} contributed to {vault.name}
          </p>
          {txHash ? (
            <Link
              href={basescanTxUrl(txHash) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs font-semibold text-[#1B5E20] underline"
            >
              View on Basescan →
            </Link>
          ) : null}
          <Button
            type="button"
            className="mt-6 w-full"
            size="lg"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={() => {
          reset();
          onClose();
        }}
        title={
          uiStep === "approve"
            ? "Step 1 of 2 — Approve USDC"
            : "Step 2 of 2 — Confirm Contribution"
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#F5F7F5] p-4">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Vault
            </p>
            <p className="text-base font-semibold text-[#1A1A1A]">{vault.name}</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">
              {formatUsdc(amount)}
            </p>
            <p className="text-xs text-[#6B7280]">
              Round {vault.currentRound} of {vault.totalRounds}
              {paidCount != null
                ? ` · ${paidCount} of ${vault.memberCount} paid`
                : ""}
            </p>
            <p className="mt-2 text-[11px] font-mono text-[#4B5563]">
              Your wallet: {truncateAddress(address)}
            </p>
            <Link
              href={basescanAddressUrl(vault.contractAddress) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[11px] font-mono text-[#1B5E20] underline"
            >
              {truncateAddress(vault.contractAddress)} ↗
            </Link>
          </div>

          {uiStep === "approve" ? (
            <p className="text-sm text-[#6B7280]">
              Allow the KatangaX vault contract to use your USDC for this
              contribution.
            </p>
          ) : (
            <p className="text-sm text-[#6B7280]">
              Send your contribution to the vault on Base mainnet.
            </p>
          )}

          <TxReviewCard
            action={uiStep === "approve" ? "Approve USDC" : "Contribute"}
            vaultName={vault.name}
            amountLabel={formatUsdc(amount)}
            gasFormatted={gas.formatted}
          />

          <GasEstimateCard
            formatted={gas.formatted}
            isLoading={gas.isLoading}
            hasInsufficientEth={gas.hasInsufficientEth}
          />

          <TransactionStatus
            status={status === "idle" && isConfirming ? "pending" : status}
            txHash={txHash}
            message={
              uiStep === "approve" && status === "pending"
                ? "Approving in wallet…"
                : status === "pending"
                  ? "Waiting for Base confirmation…"
                  : undefined
            }
            onRetry={handlePrimary}
          />

          {error && status === "error" ? (
            <p className="text-xs text-[#DC2626]">{error}</p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={status === "pending"}
            onClick={handlePrimary}
          >
            {status === "pending" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirm in wallet…
              </span>
            ) : uiStep === "approve" ? (
              `Approve ${formatUsdc(amount)}`
            ) : (
              `Contribute ${formatUsdc(amount)}`
            )}
          </Button>
        </div>
      </BottomSheet>

      <UsdcOnrampSheet
        open={onrampOpen}
        onClose={() => setOnrampOpen(false)}
        walletAddress={address}
      />
    </>
  );
}
