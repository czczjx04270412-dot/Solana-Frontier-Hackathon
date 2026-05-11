import type { Loan } from "@/lib/types";

function statusLabel(loan: Loan | null) {
  if (!loan) return "No Active Loan";
  if (loan.vaultStatus === "repaid") return "Profit target reached, ready for settlement";
  if (loan.vaultStatus === "withdrawn") return "Closed, both parties can withdraw";
  if (loan.vaultStatus === "liquidated") return "Liquidated, strategy stopped";
  if (loan.vaultStatus === "loss") return "Processing loss, deducting reinvest pool and collateral";
  return "Running, strategy executing";
}

export default function SettlementSummary({ loan }: { loan: Loan | null }) {
  const principal = loan?.amount ?? 0;
  const targetProfit = loan?.interestDue ?? 0;
  const lenderProfitLocked = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyReinvestPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const originalCollateral = loan?.collateral ?? 0;
  const lossAbsorbed = Math.max(0, originalCollateral - collateral);
  const latestPnl = loan?.lastPnl ?? 0;
  const totalPnl = loan?.currentYield ?? 0;
  const vaultNav = loan?.vaultNav ?? principal + collateral + lenderProfitLocked + strategyReinvestPool;
  const remainingProfit = Math.max(0, targetProfit - lenderProfitLocked);
  const exitReady = lenderProfitLocked >= targetProfit && vaultNav >= principal + lenderProfitLocked;

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Settlement Summary</p>
          <h2 className="mt-2 text-xl font-semibold">Final P&L Overview</h2>
        </div>
        <span className="rounded-md bg-aqua/10 px-3 py-2 text-sm text-aqua">
          {statusLabel(loan)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Latest P&L</p>
          <p className={latestPnl < 0 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-lime"}>
            {latestPnl >= 0 ? "+" : ""}{latestPnl.toFixed(2)} USDC
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Cumulative Strategy P&L</p>
          <p className={totalPnl < 0 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-lime"}>
            {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} USDC
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Lender Profit Lock Pool</p>
          <p className="mt-1 font-semibold text-lime">{lenderProfitLocked.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Remaining Target Profit</p>
          <p className="mt-1 font-semibold">{remainingProfit.toFixed(2)} USDC</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Lender Principal Protection</p>
          <p className="mt-1 font-semibold text-amber">{principal.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Strategy Reinvest Pool</p>
          <p className="mt-1 font-semibold text-aqua">{strategyReinvestPool.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Vault Real-time NAV</p>
          <p className="mt-1 font-semibold">{vaultNav.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Collateral Loss Absorbed</p>
          <p className="mt-1 font-semibold text-danger">{lossAbsorbed.toFixed(2)} USDC</p>
        </div>
      </div>

      <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        On profit, 5% enters lender profit lock pool, 95% enters strategy reinvest pool. Lender profit lock pool cannot be traded by borrower.
        On loss, strategy reinvest pool is deducted first, then borrower collateral. Lender profit lock pool and principal protection are never deducted.
        {exitReady ? " Exit conditions met: lender target profit is locked, Vault NAV covers principal and locked profit." : ""}
      </p>
    </section>
  );
}
