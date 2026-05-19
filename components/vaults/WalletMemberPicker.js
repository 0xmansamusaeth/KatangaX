"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveWalletInput } from "@/lib/web3/walletMembers";
import { truncateAddress } from "@/lib/web3/utils";

/**
 * @param {{
 *   addedMembers: { id: string, walletAddress: string, label: string }[],
 *   onAdd: (m: { id: string, walletAddress: string, label: string }) => void,
 *   onRemove: (id: string) => void,
 *   organiserAddress?: string,
 *   maxMembers: number,
 * }} props
 */
export function WalletMemberPicker({
  addedMembers,
  onAdd,
  onRemove,
  organiserAddress,
  maxMembers,
}) {
  const [input, setInput] = useState("");
  const [resolved, setResolved] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const expectedInvites = Math.max(0, maxMembers - 1);
  const canAddMore = addedMembers.length < expectedInvites;

  const handleResolve = async () => {
    setLoading(true);
    setError("");
    setResolved(null);
    const result = await resolveWalletInput(input);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Invalid address");
      return;
    }
    if (
      organiserAddress &&
      result.address.toLowerCase() === organiserAddress.toLowerCase()
    ) {
      setError("Organiser is already included as member #1");
      return;
    }
    if (
      addedMembers.some(
        (m) => m.walletAddress.toLowerCase() === result.address.toLowerCase(),
      )
    ) {
      setError("Address already added");
      return;
    }
    setResolved(result);
  };

  const handleAdd = () => {
    if (!resolved?.address) return;
    const label = truncateAddress(resolved.address);
    onAdd({
      id: resolved.address,
      walletAddress: resolved.address,
      label: resolved.ensName ? `${resolved.ensName}` : label,
    });
    setInput("");
    setResolved(null);
    setError("");
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="wallet-member">Add member by wallet address</Label>
      <div className="flex gap-2">
        <Input
          id="wallet-member"
          placeholder="0x… or name.eth"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResolved(null);
            setError("");
          }}
          className="font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!input.trim() || loading}
          onClick={handleResolve}
        >
          {loading ? "…" : "Check"}
        </Button>
      </div>
      {resolved ? (
        <div className="rounded-lg bg-[#16A34A]/10 p-2 text-xs text-[#166534]">
          Resolved: {truncateAddress(resolved.address)}
          {resolved.ensName ? ` (${resolved.ensName})` : ""}
          {canAddMore ? (
            <Button
              type="button"
              size="sm"
              className="mt-2 w-full"
              onClick={handleAdd}
            >
              Add member
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-xs text-[#DC2626]">{error}</p> : null}

      {organiserAddress ? (
        <p className="text-xs text-[#6B7280]">
          Your wallet ({truncateAddress(organiserAddress)}) is member #1 as
          organiser.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {addedMembers.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-mono text-[11px] shadow-sm"
          >
            {m.label}
            <button
              type="button"
              className="text-[#DC2626]"
              onClick={() => onRemove(m.id)}
              aria-label="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
