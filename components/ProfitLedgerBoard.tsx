import type { Loan } from "@/lib/types";

function money(value: number) {
  return `${value.toFixed(2)} USDC`;
}

function tone(value: number) {
  if (value > 0) return "text-lime";
  if (value < 0) return "text-danger";
  return "text-slate-200";
}

export default function ProfitLedgerBoard({ loan }: { loan: Loan | null }) {
  const principal = loan?.amount ?? 0;
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const originalCollateral = loan?.collateral ?? 0;
  const vaultNav = loan?.vaultNav ?? principal + originalCollateral;
  const totalPnl = loan?.currentYield ?? 0;
  const latestPnl = loan?.lastPnl ?? 0;
  const history = loan?.pnlHistory ?? [];
  const weeklyPnl = history.slice(-7).reduce((sum, point) => sum + point.pnl, 0);
  const monthlyPnl = history.slice(-30).reduce((sum, point) => sum + point.pnl, 0);
  const remainingTarget = Math.max(0, targetProfit - lockedProfit);
  const lenderExitAmount = principal + lockedProfit;
  const exitReady = lockedProfit >= targetProfit && vaultNav >= lenderExitAmount;
  const collateralLoss = Math.max(0, originalCollateral - collateral);
  const progress = targetProfit > 0 ? Math.min(100, Math.round((lockedProfit / targetProfit) * 100)) : 0;

  return (
    <section className="rounded-lg border border-line bg-panel p-6 shadow-glow">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">PROFIT LEDGER</p>
          <h2 className="mt-2 text-3xl font-semibold">Profit Ledger Dashboard</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            Shows final profit allocation, not trading details. All earnings stay inside the Vault:
            Lender profit lock pool cannot be traded; strategy reinvest pool continues to be used by borrower.
          </p>
        </div>
        <div className={exitReady ? "rounded-md bg-lime/10 px-5 py-3 text-lg font-semibold text-lime" : "rounded-md bg-aqua/10 px-5 py-3 text-lg font-semibold text-aqua"}>
          {exitReady ? "Exit Conditions Met" : "Protocol Running"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-line bg-ink p-5">
          <p className="text-sm text-slate-500">Lender View</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-slate-400">Principal Protection</p>
              <p className="mt-1 text-3xl font-semibold text-amber">{money(principal)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Profit Lock Pool</p>
              <p className="mt-1 text-3xl font-semibold text-lime">{money(lockedProfit)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Lender Exit Amount</p>
              <p className="mt-1 text-2xl font-semibold">{money(lenderExitAmount)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-ink p-5">
          <p className="text-sm text-slate-500">Borrower View</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-slate-400">Strategy Reinvest Pool</p>
              <p className="mt-1 text-3xl font-semibold text-aqua">{money(strategyPool)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Current Collateral Balance</p>
              <p className="mt-1 text-3xl font-semibold text-lime">{money(collateral)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Collateral Loss Absorbed</p>
              <p className="mt-1 text-2xl font-semibold text-danger">{money(collateralLoss)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-ink p-5">
          <p className="text-sm text-slate-500">Vault Settlement View</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-slate-400">Vault Real-time NAV</p>
              <p className="mt-1 text-3xl font-semibold text-aqua">{money(vaultNav)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Cumulative Strategy P&L</p>
              <p className={`mt-1 text-3xl font-semibold ${tone(totalPnl)}`}>
                {totalPnl >= 0 ? "+" : ""}{money(totalPnl)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Latest Daily P&L</p>
              <p className={`mt-1 text-2xl font-semibold ${tone(latestPnl)}`}>
                {latestPnl >= 0 ? "+" : ""}{money(latestPnl)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-black/20 p-4">
          <p className="text-sm text-slate-500">Daily P&L</p>
          <p className={`mt-2 text-2xl font-semibold ${tone(latestPnl)}`}>
            {latestPnl >= 0 ? "+" : ""}{money(latestPnl)}
          </p>
        </div>
        <div className="rounded-lg bg-black/20 p-4">
          <p className="text-sm text-slate-500">Weekly P&L</p>
          <p className={`mt-2 text-2xl font-semibold ${tone(weeklyPnl)}`}>
            {weeklyPnl >= 0 ? "+" : ""}{money(weeklyPnl)}
          </p>
        </div>
        <div className="rounded-lg bg-black/20 p-4">
          <p className="text-sm text-slate-500">Monthly P&L</p>
          <p className={`mt-2 text-2xl font-semibold ${tone(monthlyPnl)}`}>
            {monthlyPnl >= 0 ? "+" : ""}{money(monthlyPnl)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-line bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Lender Target Profit Progress</p>
            <p className="mt-1 text-xl font-semibold">
              {money(lockedProfit)} / {money(targetProfit)}
            </p>
          </div>
          <div className="text-sm text-slate-400">
            Remaining target: <span className="font-semibold text-slate-100">{money(remainingTarget)}</span>
          </div>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Exit condition: Lender profit lock pool reaches target profit, and Vault NAV is sufficient to cover lender principal + locked profit.
        </p>
      </div>
    </section>
  );
}
