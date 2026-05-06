import type { Loan } from "@/lib/types";

export default function RepaymentProgress({ loan }: { loan: Loan | null }) {
  const amount = loan?.amount ?? 0;
  const repaid = loan?.repaid ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const remaining = Math.max(0, amount - repaid);
  const percent = amount > 0 ? Math.min(100, Math.round((repaid / amount) * 100)) : 0;
  const ratio = amount > 0 ? Math.round((collateral / amount) * 100) : 0;
  const pnl = loan?.lastPnl ?? 0;
  const isLoss = pnl < 0;
  const isLiquidated = loan?.vaultStatus === "liquidated";

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Auto Repayment</p>
          <h2 className="mt-2 text-xl font-semibold">
            {isLiquidated ? "Forced liquidation" : isLoss ? "Loss waterfall" : "Profit split"}
          </h2>
        </div>
        <span className="text-2xl font-semibold text-aqua">{percent}%</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Repaid</p>
          <p className="mt-1 font-semibold text-lime">{repaid.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Remaining Debt</p>
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
        {pnl >= 0
          ? `Latest profit: +${pnl.toFixed(2)}U. Split: 50% auto repayment, 30% borrower, 20% lender.`
          : `Latest loss: ${pnl.toFixed(2)}U. Loss is absorbed by borrower collateral first; lender principal stays protected.`}
        {isLiquidated ? " Collateral ratio is below 120%, so the strategy is stopped and the protocol is closed." : ""}
      </div>
    </section>
  );
}
