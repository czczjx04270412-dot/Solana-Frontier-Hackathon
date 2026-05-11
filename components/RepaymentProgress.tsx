import type { Loan } from "@/lib/types";

export default function RepaymentProgress({ loan }: { loan: Loan | null }) {
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const remainingProfit = Math.max(0, targetProfit - lockedProfit);
  const percent = targetProfit > 0 ? Math.min(100, Math.round((lockedProfit / targetProfit) * 100)) : 0;
  const ratio = loan?.amount ? Math.round((collateral / loan.amount) * 100) : 0;
  const pnl = loan?.lastPnl ?? 0;
  const isLoss = pnl < 0;
  const isLiquidated = loan?.vaultStatus === "liquidated";
  const isRepaid = loan?.vaultStatus === "repaid" || loan?.vaultStatus === "withdrawn";

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Lender Profit Lock</p>
          <h2 className="mt-2 text-xl font-semibold">
            {isRepaid ? "Profit Target Reached" : isLiquidated ? "Forced Liquidation" : isLoss ? "Loss deducted from reinvest pool" : "Profit split 10/90"}
          </h2>
        </div>
        <span className="text-2xl font-semibold text-aqua">{percent}%</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Lender Profit Lock Pool</p>
          <p className="mt-1 font-semibold text-lime">{lockedProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Remaining Target Profit</p>
          <p className="mt-1 font-semibold">{remainingProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Current Ratio</p>
          <p className={ratio < 120 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-amber"}>
            {ratio}%
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {isRepaid
          ? `Lender target profit locked. On settlement, lender recovers principal + locked profit; borrower gets remaining collateral and reinvest pool.`
          : pnl >= 0
            ? `Latest profit: +${pnl.toFixed(2)}U. 5% locked for lender, 95% stays in strategy reinvest pool for borrower trading. Current reinvest pool: ${strategyPool.toFixed(2)} USDC.`
            : `Latest loss: ${pnl.toFixed(2)}U. Loss deducted from strategy reinvest pool first; shortfall deducted from borrower collateral. Lender profit lock pool and principal are never affected.`}
        {isLiquidated ? " Liquidation triggered. Strategy stopped, lender principal is prioritized." : ""}
      </div>
    </section>
  );
}
