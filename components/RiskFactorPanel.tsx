import type { RiskResult } from "@/lib/types";

export default function RiskFactorPanel({ risk }: { risk: RiskResult | null }) {
  if (!risk) {
    return (
      <section className="rounded-lg border border-dashed border-line bg-panel/70 p-5">
        <p className="text-sm text-slate-400">后台风控明细会在借款申请后显示。</p>
      </section>
    );
  }

  const factors = Object.values(risk.factors);

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Worker Only</p>
          <h2 className="mt-2 text-xl font-semibold">ZK 风控明细</h2>
        </div>
        <span className="rounded-md bg-aqua/10 px-3 py-2 text-sm text-aqua">后台可见</span>
      </div>
      <div className="mt-5 space-y-3">
        {factors.map((factor) => (
          <div key={factor.label} className="rounded-md bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-200">{factor.label}</span>
              <span className="text-sm text-slate-400">{factor.weight}% 权重</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
              <div className="h-full rounded-full bg-aqua" style={{ width: `${factor.score}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {factor.score}/100 · {factor.explanation}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
