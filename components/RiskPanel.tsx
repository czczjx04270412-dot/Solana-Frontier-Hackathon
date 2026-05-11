import type { RiskResult } from "@/lib/types";

const riskStyle = {
  "very-low": "border-lime/40 bg-lime/10 text-lime",
  low: "border-lime/40 bg-lime/10 text-lime",
  medium: "border-amber/40 bg-amber/10 text-amber",
  elevated: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  high: "border-danger/40 bg-danger/10 text-danger",
  liquidation: "border-danger/60 bg-danger/15 text-danger"
};

export default function RiskPanel({ risk }: { risk: RiskResult | null }) {
  if (!risk) {
    return (
      <section className="rounded-lg border border-dashed border-line bg-panel/70 p-5">
        <p className="text-sm text-slate-400">Risk score will be generated after submitting a loan application.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Public Risk Summary</p>
          <p className="mt-2 text-4xl font-semibold text-slate-50">{risk.creditScore}</p>
        </div>
        <span className={`rounded-md border px-3 py-2 text-sm ${riskStyle[risk.riskLevel]}`}>
          {risk.riskLabel}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Collateral Ratio</p>
          <p className="mt-1 font-semibold">{risk.collateralRatio}%</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Risk Decision</p>
          <p className={risk.approved ? "mt-1 font-semibold text-lime" : "mt-1 font-semibold text-danger"}>
            {risk.approved ? "Approved" : "Rejected"}
          </p>
        </div>
      </div>
      <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {risk.lenderVisibleReason}
      </p>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Collateral ratio is public information. ZK is not used to hide collateral ratio, but to prove that yield ability, strategy exposure, default history, asset source, and market model data have been verified without revealing details.
      </p>
    </section>
  );
}
