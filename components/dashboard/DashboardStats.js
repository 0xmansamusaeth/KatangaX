import { Card, CardContent } from "@/components/ui/card";
import { formatUSDC } from "@/lib/utils";

export function DashboardStats({ activeVaults, monthlyOut }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-text-secondary">Active vaults</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {activeVaults}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-text-secondary">Scheduled out (month)</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {formatUSDC(monthlyOut)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
