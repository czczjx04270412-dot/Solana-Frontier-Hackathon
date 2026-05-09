import type { Loan } from "@/lib/types";

const exampleAmount = 800;
const riskRows = [
  { risk: "低风险", target: "8% - 12%", min: 0.08, max: 0.12 },
  { risk: "中风险", target: "12% - 20%", min: 0.12, max: 0.2 },
  { risk: "高风险", target: "20% - 35%", min: 0.2, max: 0.35 }
];

export default function LoanEconomicsPanel({ loan }: { loan: Loan | null }) {
  const amount = loan?.amount ?? 0;
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const remaining = Math.max(0, targetProfit - lockedProfit);
  const exitReady = loan?.vaultStatus === "repaid" || loan?.vaultStatus === "withdrawn";

  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">LOAN ECONOMICS</p>
          <h2 className="mt-2 text-xl font-semibold">目标利润退出机制</h2>
        </div>
        <span className={exitReady ? "rounded bg-lime/10 px-3 py-2 text-sm text-lime" : "rounded bg-aqua/10 px-3 py-2 text-sm text-aqua"}>
          {exitReady ? "贷方可退出" : "协议运行中"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Item label="贷方本金" value={`${amount.toFixed(2)} USDC`} />
        <Item label="目标利润" value={`${targetProfit.toFixed(2)} USDC`} tone="text-amber" />
        <Item label="已锁定利润" value={`${lockedProfit.toFixed(2)} USDC`} tone="text-lime" />
        <Item label="剩余目标" value={`${remaining.toFixed(2)} USDC`} />
      </div>

      <div className="mt-4 rounded-md border border-line bg-ink p-3 text-sm leading-6 text-slate-300">
        每次盈利时，5% 锁入贷方利润池，95% 留在策略复投池继续交易。贷方利润锁定池达到目标利润，并且 Vault 净值足够覆盖贷方本金和锁定利润时，协议进入结算。
        当前策略复投池：<strong className="text-aqua">{strategyPool.toFixed(2)} USDC</strong>。
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-slate-400">
            <tr>
              <th className="px-3 py-3 font-medium">风险等级</th>
              <th className="px-3 py-3 font-medium">目标收益率</th>
              <th className="px-3 py-3 font-medium">借 800U 时贷方目标利润</th>
              <th className="px-3 py-3 font-medium">退出时贷方应收</th>
            </tr>
          </thead>
          <tbody>
            {riskRows.map((row) => {
              const minProfit = exampleAmount * row.min;
              const maxProfit = exampleAmount * row.max;
              return (
                <tr key={row.risk} className="border-t border-line">
                  <td className="px-3 py-3 text-slate-200">{row.risk}</td>
                  <td className="px-3 py-3 text-slate-300">{row.target}</td>
                  <td className="px-3 py-3 text-lime">
                    {minProfit.toFixed(0)} - {maxProfit.toFixed(0)} USDC
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {(exampleAmount + minProfit).toFixed(0)} - {(exampleAmount + maxProfit).toFixed(0)} USDC
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Item({ label, value, tone = "text-slate-100" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-ink p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
