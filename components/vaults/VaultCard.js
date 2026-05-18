import Link from "next/link";
import { Landmark, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const statusVariant = {
  active: "success",
  completed: "secondary",
  paused: "warning",
};

export function VaultCard({ vault }) {
  const pct =
    vault.totalRounds > 0
      ? Math.round((vault.currentRound / vault.totalRounds) * 100)
      : 0;

  return (
    <Link
      href={`/vaults/${vault.id}`}
      className="block transition duration-150 ease-out active:scale-[0.98]"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-semibold text-text-primary">
                {vault.name}
              </p>
              <p className="text-sm text-text-secondary">
                {formatCurrency(vault.contributionAmount, "ZMW")} ·{" "}
                {vault.contributionPeriod === "week" ? "Weekly" : "Monthly"}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={statusVariant[vault.status] ?? "outline"}>
                  {vault.status === "active"
                    ? "Active"
                    : vault.status === "completed"
                      ? "Completed"
                      : vault.status}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                  <Users className="h-3.5 w-3.5" />
                  {vault.memberCount} members
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              <Landmark className="h-5 w-5 text-primary" />
              <p className="text-xs text-text-secondary">
                Round {vault.currentRound}/{vault.totalRounds}
              </p>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
