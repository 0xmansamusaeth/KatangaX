"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Coins,
  Octagon,
  Pencil,
  UserMinus,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import { resolveMemberDisplay } from "@/lib/utils";

/**
 * @param {{ vault: any }} props
 */
export function OrganiserActions({ vault }) {
  const router = useRouter();
  const { user } = useUser();
  const { disbursePayout, endVault, removeMember } = useVaults();

  const [disburseOpen, setDisburseOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [removeSheetOpen, setRemoveSheetOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(/** @type {any} */ (null));

  const handleDisburse = () => {
    disbursePayout(vault.id);
    setDisburseOpen(false);
    toast("Payout disbursed. The next round has started.");
  };

  const handleEnd = () => {
    endVault(vault.id);
    setEndOpen(false);
    toast("Vault ended. No further contributions will be collected.", {
      variant: "info",
    });
  };

  const handleRemove = () => {
    if (!memberToRemove) return;
    removeMember(vault.id, memberToRemove.id);
    setMemberToRemove(null);
    setRemoveSheetOpen(false);
    toast("Member removed from the vault.", { variant: "info" });
  };

  return (
    <>
      <section className="mt-8 border-t border-[#E5E7EB] pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
          Organiser Actions
        </h3>
        <div className="mt-3 space-y-2">
          <Button
            type="button"
            variant="accent"
            size="lg"
            className="w-full justify-start gap-2"
            onClick={() => setDisburseOpen(true)}
            disabled={vault.status !== "active"}
          >
            <Coins className="h-5 w-5" />
            Disburse Payout
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-2"
            asChild
          >
            <Link href={`/vaults/${vault.id}/edit`}>
              <Pencil className="h-5 w-5" />
              Edit Vault Rules
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-2"
            onClick={() => setRemoveSheetOpen(true)}
          >
            <UserMinus className="h-5 w-5" />
            Remove a Member
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-2 border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/5"
            onClick={() => setEndOpen(true)}
            disabled={vault.status !== "active"}
          >
            <Octagon className="h-5 w-5" />
            End Vault Early
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={disburseOpen}
        title="Disburse this round’s payout?"
        description={`This advances the vault to Round ${Math.min(
          vault.currentRound + 1,
          vault.totalRounds,
        )} and releases the pot to the scheduled recipient.`}
        confirmLabel="Yes, disburse"
        variant="accent"
        onConfirm={handleDisburse}
        onCancel={() => setDisburseOpen(false)}
      />

      <ConfirmDialog
        open={endOpen}
        title="End this vault early?"
        description="No further contributions will be collected. Outstanding payouts must be settled manually. This cannot be undone."
        confirmLabel="End vault"
        variant="destructive"
        onConfirm={handleEnd}
        onCancel={() => setEndOpen(false)}
      />

      <BottomSheet
        open={removeSheetOpen}
        onClose={() => setRemoveSheetOpen(false)}
        title="Remove a member"
      >
        <ul className="max-h-[55vh] space-y-2 overflow-y-auto">
          {(vault.members ?? [])
            .filter((m) => m.id !== vault.organiserId)
            .map((m) => {
              const display = resolveMemberDisplay(m, user);
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-[#F5F7F5] p-2"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: display.avatarColor }}
                  >
                    {display.initials}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#1A1A1A]">
                    {display.name}
                    {display.isYou ? " (You)" : ""}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/5"
                    onClick={() => setMemberToRemove(m)}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
        </ul>
      </BottomSheet>

      <ConfirmDialog
        open={!!memberToRemove}
        title={`Remove ${memberToRemove?.name ?? "this member"}?`}
        description="They will lose access to this vault and their slot will be re-numbered."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemove}
        onCancel={() => setMemberToRemove(null)}
      />
    </>
  );
}
