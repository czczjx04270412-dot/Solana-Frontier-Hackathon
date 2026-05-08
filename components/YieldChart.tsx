import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Loan } from "@/lib/types";
import { buildLoan, createYieldSeries } from "@/lib/mock";

const fallbackLoan: Loan = {
  ...buildLoan(500, 920, "演示钱包"),
  id: "empty",
  funded: true,
  vaultStatus: "strategy",
  currentYield: 2,
  lastPnl: 2,
  lenderProfitLocked: 0.1,
  strategyReinvestPool: 1.9,
  vaultUsdc: 1422,
  vaultNav: 1422,
  unrealizedPnl: 2,
  repaid: 0.1,
  lenderEarnings: 0.1,
  borrowerEarnings: 1.9,
  pnlHistory: [{ day: "D1", pnl: 2, yield: 2, repaid: 0.1, collateral: 920 }]
};

export default function YieldChart({ loan }: { loan: Loan | null }) {
  const data = createYieldSeries(loan ?? fallbackLoan);
  const dailyPnl = data.at(-1)?.pnl ?? 0;
  const weeklyPnl = data.slice(-7).reduce((sum, point) => sum + point.pnl, 0);
  const monthlyPnl = data.slice(-30).reduce((sum, point) => sum + point.pnl, 0);
  const pnlClass = (value: number) => (value >= 0 ? "text-lime" : "text-danger");

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">策略盈亏模拟</p>
      <h2 className="mt-2 text-xl font-semibold">收益趋势与锁定利润</h2>
      <p className="mt-2 text-sm text-slate-400">
        每日盈亏按 Vault 净值 -10% 到 +10% 模拟，图表保留最近 30 天，不再卡在 D15。
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">日收益</p>
          <p className={`mt-1 font-semibold ${pnlClass(dailyPnl)}`}>
            {dailyPnl >= 0 ? "+" : ""}{dailyPnl.toFixed(2)} USDC
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">周收益</p>
          <p className={`mt-1 font-semibold ${pnlClass(weeklyPnl)}`}>
            {weeklyPnl >= 0 ? "+" : ""}{weeklyPnl.toFixed(2)} USDC
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">月收益</p>
          <p className={`mt-1 font-semibold ${pnlClass(monthlyPnl)}`}>
            {monthlyPnl >= 0 ? "+" : ""}{monthlyPnl.toFixed(2)} USDC
          </p>
        </div>
      </div>
      <div className="mt-5 h-80">
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
            <Tooltip contentStyle={{ background: "#111721", border: "1px solid #273244", borderRadius: 8 }} labelStyle={{ color: "#e2e8f0" }} />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="pnl" name="当日盈亏" stroke="#f2c35f" fill="transparent" strokeWidth={2} />
            <Area type="monotone" dataKey="yield" name="累计策略盈亏" stroke="#28d7c4" fill="url(#yieldFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="repaid" name="贷方利润锁定池" stroke="#a6e86f" fill="transparent" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
