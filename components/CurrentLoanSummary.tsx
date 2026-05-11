import type { Loan } from "@/lib/types";

function statusText(loan: Loan | null) {
  if (!loan) return "No Active Loan";
  if (loan.vaultStatus === "liquidated") return "Liquidated";
  if (loan.vaultStatus === "repaid") return "Profit Target Reached";
  if (loan.vaultStatus === "withdrawn") return "Withdrawn";
  if (loan.vaultStatus === "loss") return "Processing Loss";
  if (loan.vaultStatus === "strategy") return "Strategy Running";
  if (loan.vaultStatus === "funded") return "Funded";
  return "Awaiting Funding";
}

export default function CurrentLoanSummary({ loan }: { loan: Loan | null }) {
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const ratio = loan?.amount ? Math.round((collateral / loan.amount) * 100) : 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Current Loan Summary</p>
          <h2 className="mt-2 text-xl font-semibold">{statusText(loan)}</h2>
        </div>
        <span className="rounded-md bg-aqua/10 px-3 py-2 text-sm text-aqua">
          {loan?.risk.riskLabel ?? "No Risk Data"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Loan Amount</p>
          <p className="mt-1 font-semibold">{(loan?.amount ?? 0).toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Current Collateral</p>
          <p className="mt-1 font-semibold text-lime">{collateral.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Current Ratio</p>
          <p className={ratio < 120 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-amber"}>{ratio}%</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Lender Locked Profit</p>
          <p className="mt-1 font-semibold text-aqua">{lockedProfit.toFixed(2)} USDC</p>
        </div>
      </div>
    </section>
  );
}
