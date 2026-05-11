import type { Loan } from "@/lib/types";

export default function LenderDecisionPanel({ loan }: { loan: Loan }) {
  const worstCase = loan.risk.riskLevel === "high" || loan.risk.riskLevel === "liquidation"
    ? "May liquidate quickly, lender principal is prioritized but interest is uncertain"
    : "Strong principal protection, low liquidation probability";
  const bestCase = `Recover principal ${loan.amount.toFixed(2)} USDC + interest ${loan.interestDue.toFixed(2)} USDC`;

  return (
    <div className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
      <p className="font-semibold text-slate-100">Lender Decision</p>
      <p className="mt-2">Best case: {bestCase}</p>
      <p>Worst case: {worstCase}</p>
      <p>Key factors: principal protection, interest recovery, liquidation risk, fund lock duration.</p>
    </div>
  );
}
