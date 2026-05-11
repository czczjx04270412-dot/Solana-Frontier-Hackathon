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
        <p className="text-sm text-slate-400">提交借款申请后会生成风险评分。</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">公开风险摘要</p>
          <p className="mt-2 text-4xl font-semibold text-slate-50">{risk.creditScore}</p>
        </div>
        <span className={`rounded-md border px-3 py-2 text-sm ${riskStyle[risk.riskLevel]}`}>
          {risk.riskLabel}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">公开抵押率</p>
          <p className="mt-1 font-semibold">{risk.collateralRatio}%</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">风控结论</p>
          <p className={risk.approved ? "mt-1 font-semibold text-lime" : "mt-1 font-semibold text-danger"}>
            {risk.approved ? "通过" : "拒绝"}
          </p>
        </div>
      </div>
      <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {risk.lenderVisibleReason}
      </p>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        抵押率是公开信息，ZK 不是用来隐藏抵押率，而是用来证明收益能力、策略暴露、历史违约、资产来源和市场模型等隐私数据已通过验证。
      </p>
    </section>
  );
}
