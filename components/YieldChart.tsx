import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Loan } from "@/lib/types";
import { createYieldSeries } from "@/lib/mock";

export default function YieldChart({ loan }: { loan: Loan | null }) {
  const data = createYieldSeries(loan ?? {
    id: "empty",
    borrower: "Demo",
    amount: 500,
    collateral: 800,
    risk: {
      creditScore: 72,
      collateralRatio: 160,
      riskLevel: "medium",
      riskLabel: "中风险",
      riskExplanation: "抵押率位于 140%-160%，可接受但需要关注收益表现。",
      defaultProbability: "12%",
      approved: true,
      factors: {
        collateralRatio: { label: "抵押率", score: 68, weight: 40, explanation: "抵押率可接受。", private: false },
        yieldAbility: { label: "收益能力", score: 72, weight: 30, explanation: "收益能力中等。", private: true },
        strategyRisk: { label: "策略风险", score: 76, weight: 20, explanation: "策略风险中等。", private: true },
        marketVolatility: { label: "市场波动", score: 72, weight: 10, explanation: "市场波动可控。", private: true }
      },
      aiReason: "AI 风控判断为中风险。",
      lenderVisibleReason: "AI 风控判断为中风险。"
    },
    expectedYield: "13.2%",
    currentYield: 2,
    repaid: 1,
    borrowerEarnings: 0.6,
    lenderEarnings: 0.4,
    createdAt: new Date().toISOString(),
    funded: true,
    vaultStatus: "strategy"
  });

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Yield Simulation</p>
      <h2 className="mt-2 text-xl font-semibold">每日 +2 USDC</h2>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="yieldFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#28d7c4" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#28d7c4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#273244" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ background: "#111721", border: "1px solid #273244", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Area type="monotone" dataKey="yield" stroke="#28d7c4" fill="url(#yieldFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="repaid" stroke="#a6e86f" fill="transparent" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
