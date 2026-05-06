import type { Loan } from "@/lib/types";

export default function RepaymentProgress({ loan }: { loan: Loan | null }) {
  const target = loan?.repaymentTarget ?? loan?.amount ?? 0;
  const repaid = loan?.repaid ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const remaining = Math.max(0, target - repaid);
  const percent = target > 0 ? Math.min(100, Math.round((repaid / target) * 100)) : 0;
  const ratio = loan?.amount ? Math.round((collateral / loan.amount) * 100) : 0;
  const pnl = loan?.lastPnl ?? 0;
  const isLoss = pnl < 0;
  const isLiquidated = loan?.vaultStatus === "liquidated";
  const isRepaid = loan?.vaultStatus === "repaid" || loan?.vaultStatus === "withdrawn";

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Loan Repayment</p>
          <h2 className="mt-2 text-xl font-semibold">
            {isRepaid ? "Principal + interest repaid" : isLiquidated ? "Forced liquidation" : isLoss ? "Loss waterfall" : "Profit split"}
          </h2>
        </div>
        <span className="text-2xl font-semibold text-aqua">{percent}%</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Paid to Lender</p>
          <p className="mt-1 font-semibold text-lime">{repaid.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Remaining Principal + Interest</p>
          <p className="mt-1 font-semibold">{remaining.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Collateral Ratio</p>
          <p className={ratio < 120 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-amber"}>
            {ratio}%
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {isRepaid
          ? "Loan principal and interest are fully repaid. The lender no longer controls the shared vault account. The borrower can continue borrowing or withdraw to a personal wallet."
          : pnl >= 0
            ? `Latest profit: +${pnl.toFixed(2)}U. 50% repays principal + interest, 30% goes to borrower, 20% goes to lender yield.`
            : `Latest loss: ${pnl.toFixed(2)}U. Borrower collateral absorbs losses first; lender principal remains protected.`}
        {isLiquidated ? " Collateral ratio is below 120%, so the strategy stops and the protocol is closed." : ""}
      </div>
    </section>
  );
}
