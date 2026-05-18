import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function ContributionHistory({ history, currency = "ZMW" }) {
  if (!history?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent contributions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((h) => (
          <div
            key={h.period}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{h.period}</p>
              <p className="text-xs text-text-secondary">
                Collected {formatCurrency(h.totalCollected, currency)} · Expected{" "}
                {formatCurrency(h.expectedTotal, currency)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
