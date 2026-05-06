import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Loan } from "@/lib/types";
import { createYieldSeries } from "@/lib/mock";

const fallbackLoan: Loan = {
  id: "empty",
  borrower: "Demo",
  amount: 500,
  collateral: 800,
  risk: {
    creditScore: 72,
    collateralRatio: 160,
    riskLevel: "medium",
    riskLabel: "Medium",
    riskExplanation: "Collateral ratio is acceptable.",
    defaultProbability: "12%",
    approved: true,
    factors: {
      collateralRatio: { label: "Collateral Ratio", score: 68, weight: 40, explanation: "Acceptable collateral.", private: false },
      yieldAbility: { label: "Yield Ability", score: 72, weight: 30, explanation: "Medium yield ability.", private: true },
      strategyRisk: { label: "Strategy Risk", score: 76, weight: 20, explanation: "Medium strategy risk.", private: true },
      marketVolatility: { label: "Market Volatility", score: 72, weight: 10, explanation: "Controlled volatility.", private: true }
    },
    aiReason: "AI risk assessment: medium risk.",
    lenderVisibleReason: "AI risk assessment: medium risk."
  },
  expectedYield: "15% APR",
  currentYield: 2,
  currentCollateral: 800,
  lastPnl: 2,
  lastEvent: "profit",
  repaid: 1,
  borrowerEarnings: 0.6,
  lenderEarnings: 0.4,
  pnlHistory: [{ day: "D1", pnl: 2, yield: 2, repaid: 1, collateral: 800 }],
  createdAt: new Date().toISOString(),
  funded: true,
  vaultStatus: "strategy"
};

export default function YieldChart({ loan }: { loan: Loan | null }) {
  const data = createYieldSeries(loan ?? fallbackLoan);

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Strategy P/L Simulation</p>
      <h2 className="mt-2 text-xl font-semibold">Daily P/L -100 to +100 USDC</h2>
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
            <Area type="monotone" dataKey="pnl" stroke="#f2c35f" fill="transparent" strokeWidth={2} />
            <Area type="monotone" dataKey="yield" stroke="#28d7c4" fill="url(#yieldFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="repaid" stroke="#a6e86f" fill="transparent" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
