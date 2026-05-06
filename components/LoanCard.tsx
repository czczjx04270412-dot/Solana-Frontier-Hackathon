import type { Loan } from "@/lib/types";
import { useLoans } from "@/lib/LoanContext";

const riskClass = {
  "very-low": "text-lime",
  low: "text-lime",
  medium: "text-amber",
  elevated: "text-orange-300",
  high: "text-danger",
  liquidation: "text-danger"
};

export default function LoanCard({ loan }: { loan: Loan }) {
  const { fundLoan, setActiveLoanId } = useLoans();

  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Borrower</p>
          <h3 className="mt-2 font-semibold">{loan.borrower}</h3>
        </div>
        <span className={`rounded-md bg-black/25 px-3 py-2 text-sm ${riskClass[loan.risk.riskLevel]}`}>
          {loan.risk.riskLabel}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-500">Amount</p>
          <p className="mt-1 font-semibold">{loan.amount} USDC</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Score</p>
          <p className="mt-1 font-semibold">{loan.risk.creditScore}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Yield</p>
          <p className="mt-1 font-semibold">{loan.expectedYield}</p>
        </div>
      </div>
      <p className="mt-4 rounded-md bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {loan.risk.lenderVisibleReason}
      </p>
      <button
        onClick={() => {
          fundLoan(loan.id);
          setActiveLoanId(loan.id);
        }}
        className="mt-5 w-full rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua transition hover:bg-aqua hover:text-ink"
      >
        {loan.funded ? "已放款，查看 Vault" : "放款"}
      </button>
    </article>
  );
}
