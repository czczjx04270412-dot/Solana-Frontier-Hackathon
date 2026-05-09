import type { RiskResult } from "@/lib/types";

export default function RiskFactorPanel({ risk }: { risk: RiskResult | null }) {
  if (!risk) {
    return (
      <section className="rounded-md border border-dashed border-line bg-panel/70 p-5">
        <p className="text-sm text-slate-400">提交借款申请后，后台风控明细会在这里显示。</p>
      </section>
    );
  }

  const factors = Object.values(risk.factors);

  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">ADMIN ONLY</p>
          <h2 className="mt-2 text-xl font-semibold">隐私风控因子</h2>
        </div>
        <span className="rounded bg-aqua/10 px-3 py-2 text-sm text-aqua">对贷方隐藏</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">
        这里代表后台工作人员能看到的完整风险拆分。贷方只看到最终评分、风险等级、推荐收益和 ZK 验证结果。
      </p>
      <div className="mt-5 space-y-3">
        {factors.map((factor) => (
          <div key={factor.label} className="rounded-md bg-ink p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-200">{factor.label}</span>
              <span className="text-sm text-slate-500">{factor.weight}% 权重</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
              <div className="h-full rounded-full bg-aqua" style={{ width: `${factor.score}%` }} />
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-400">
              {factor.score}/100 · {factor.explanation}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
