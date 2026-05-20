"use client";

import { useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/useSearch";

/**
 * @param {{
 *   addedIds: string[],
 *   onAdd: (member: any) => void,
 *   onRemove: (memberId: string) => void,
 *   excludeIds?: string[],
 *   limit?: number,
 * }} props
 */
export function MemberPicker({
  addedIds = [],
  onAdd,
  onRemove,
  excludeIds = [],
  limit = 8,
}) {
  const [query, setQuery] = useState("");
  const { results, loading } = useSearch(query);

  const exclude = new Set([...excludeIds, ...addedIds]);
  const suggestions = results
    .filter((m) => !exclude.has(m.id))
    .slice(0, limit);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username"
          className="pl-9"
          aria-label="Search members"
        />
      </div>

      {loading ? (
        <p className="text-center text-xs text-[#6B7280]">Searching…</p>
      ) : suggestions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white px-3 py-4 text-center text-xs text-[#6B7280]">
          {query.length >= 2
            ? "No profiles found."
            : "Type at least 2 characters to search."}
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: m.avatarColor }}
              >
                {m.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1A1A1A]">
                  {m.name}
                </p>
                <p className="truncate text-xs text-[#6B7280]">
                  @{m.username}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1 border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20]/5"
                onClick={() =>
                  onAdd?.({
                    id: m.id,
                    name: m.name,
                    initials: m.initials,
                    avatarColor: m.avatarColor,
                    userId: m.id,
                    walletAddress: m.walletAddress,
                  })
                }
              >
                <UserPlus className="h-4 w-4" />
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * @param {{
 *   member: { id: string, name: string, initials: string, avatarColor: string, locked?: boolean },
 *   onRemove?: (memberId: string) => void,
 * }} props
 */
export function MemberChip({ member, onRemove }) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2 text-xs font-medium text-[#1A1A1A]"
      }
    >
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.initials}
      </div>
      <span className="max-w-[120px] truncate">{member.name}</span>
      {member.locked ? (
        <span className="rounded-full bg-[#1B5E20]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#1B5E20]">
          You
        </span>
      ) : (
        <button
          type="button"
          aria-label={`Remove ${member.name}`}
          onClick={() => onRemove?.(member.id)}
          className="flex h-5 w-5 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F5F7F5] hover:text-[#DC2626]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
