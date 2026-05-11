import type { Loan } from "@/lib/types";

const exampleAmount = 800;
const riskRows = [
  { risk: "Low Risk", target: "8% - 12%", min: 0.08, max: 0.12 },
  { risk: "Medium Risk", target: "12% - 20%", min: 0.12, max: 0.2 },
  { risk: "High Risk", target: "20% - 35%", min: 0.2, max: 0.35 }
];

export default function LoanEconomicsPanel({ loan }: { loan: Loan | null }) {
  const amount = loan?.amount ?? 0;
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const remaining = Math.max(0, targetProfit - lockedProfit);
  const exitReady = loan?.vaultStatus === "repaid" || loan?.vaultStatus === "withdrawn";

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Loan Economics</p>
          <h2 className="mt-2 text-xl font-semibold">Target Profit Exit Mechanism</h2>
        </div>
        <span className={exitReady ? "rounded-md bg-lime/10 px-3 py-2 text-sm text-lime" : "rounded-md bg-aqua/10 px-3 py-2 text-sm text-aqua"}>
          {exitReady ? "Lender Can Exit" : "Protocol Running"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Lender Principal</p>
          <p className="mt-1 font-semibold">{amount.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Target Profit</p>
          <p className="mt-1 font-semibold text-amber">{targetProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Locked Profit</p>
          <p className="mt-1 font-semibold text-lime">{lockedProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Remaining Target</p>
          <p className="mt-1 font-semibold">{remaining.toFixed(2)} USDC</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        On each profit, 5% is locked into lender profit pool, 95% stays in strategy reinvest pool for trading. When lender profit lock pool reaches target profit
        and Vault NAV covers lender principal + locked profit, protocol enters settlement. Current strategy reinvest pool:
        <strong className="text-aqua"> {strategyPool.toFixed(2)} USDC</strong>.
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/30 text-slate-400">
            <tr>
              <th className="px-3 py-3 font-medium">Risk Level</th>
              <th className="px-3 py-3 font-medium">Target Yield</th>
              <th className="px-3 py-3 font-medium">Lender Target Profit (800U Loan)</th>
              <th className="px-3 py-3 font-medium">Lender Exit Amount</th>
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
