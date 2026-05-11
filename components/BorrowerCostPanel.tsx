import type { Loan } from "@/lib/types";

export default function BorrowerCostPanel({ loan }: { loan: Loan | null }) {
  const amount = loan?.amount ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const ratio = amount > 0 ? Math.round((collateral / amount) * 100) : 0;
  const liquidationBuffer = Math.max(0, collateral - amount * 1.2);
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const remainingProfit = Math.max(0, targetProfit - lockedProfit);

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Borrower View</p>
      <h2 className="mt-2 text-xl font-semibold">Cost & Liquidation Risk</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Recommended Target Yield</p>
          <p className="mt-1 font-semibold text-amber">{loan?.expectedYield ?? "N/A"}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Lender Target Profit</p>
          <p className="mt-1 font-semibold">{targetProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Locked Profit</p>
          <p className="mt-1 font-semibold text-aqua">{lockedProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Remaining Target Profit</p>
          <p className="mt-1 font-semibold">{remainingProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Current Ratio</p>
          <p className={ratio < 120 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-lime"}>{ratio}%</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Liquidation Buffer</p>
          <p className="mt-1 font-semibold text-amber">{liquidationBuffer.toFixed(2)} USDC</p>
        </div>
      </div>
      <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        Borrower focuses on target profit, reinvestment yield, and liquidation risk. On profit, only 5% is locked for lender, 95% stays in strategy reinvest pool.
        On loss, reinvest pool absorbs first; only when depleted does it affect borrower collateral.
      </p>
    </section>
  );
}
