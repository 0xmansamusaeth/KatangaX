import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

const payVariant = {
  paid: "success",
  pending: "secondary",
  late: "destructive",
};

export function MemberRow({ member, paymentStatus }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.initials || getInitials(member.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {member.name}
        </p>
        <p className="text-xs text-text-secondary">
          Payout order: {member.payoutOrder}
        </p>
      </div>
      {paymentStatus ? (
        <Badge
          variant={payVariant[paymentStatus] ?? "outline"}
          className="capitalize"
        >
          {paymentStatus}
        </Badge>
      ) : null}
    </div>
  );
}
