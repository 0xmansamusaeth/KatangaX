"use client";

/**
 * @param {{
 *   action: string,
 *   vaultName: string,
 *   amountLabel: string,
 *   gasFormatted?: { usdLabel: string, ethLabel: string } | null,
 * }} props
 */
export function TxReviewCard({ action, vaultName, amountLabel, gasFormatted }) {
  return (
    <div className="rounded-xl border border-[#1B5E20]/20 bg-[#1B5E20]/[0.04] p-4 text-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
        Review before confirming
      </p>
      <dl className="mt-3 space-y-2">
        <Row label="Action" value={action} />
        <Row label="Vault" value={vaultName} />
        <Row label="Amount" value={amountLabel} highlight />
        <Row
          label="Gas estimate"
          value={
            gasFormatted
              ? `${gasFormatted.usdLabel} (${gasFormatted.ethLabel} ETH)`
              : "~$0.01"
          }
        />
        <Row label="Network" value="Base Mainnet" />
      </dl>
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
