import { useRouter } from "next/router";
import type { Loan } from "@/lib/types";
import { useLoans } from "@/lib/LoanContext";
import LenderDecisionPanel from "./LenderDecisionPanel";
import AddressDisplay from "./AddressDisplay";

const riskClass = {
  "very-low": "text-lime",
  low: "text-lime",
  medium: "text-amber",
  elevated: "text-orange-300",
  high: "text-danger",
  liquidation: "text-danger"
};

function approvalText(loan: Loan) {
  if (loan.borrowerApprovalStatus === "pending") return "Loan pending risk review";
  if (loan.borrowerApprovalStatus === "rejected") return "Loan rejected";
  if (loan.lenderApprovalStatus === "pending") return "Funding pending risk review";
  if (loan.lenderApprovalStatus === "rejected") return "Funding rejected";
  if (loan.lenderApprovalStatus === "approved") return "Approved, funds entered Vault";
  return "Ready for funding";
}

export default function LoanCard({ loan }: { loan: Loan }) {
  const { fundLoan, setActiveLoanId } = useLoans();
  const router = useRouter();
  const canRequestFunding = loan.borrowerApprovalStatus === "approved" && loan.lenderApprovalStatus === "not-started";
  const buttonLabel = loan.lenderApprovalStatus === "pending"
    ? "Awaiting Admin Funding Approval"
    : loan.lenderApprovalStatus === "approved"
      ? "View Vault"
      : loan.borrowerApprovalStatus === "pending"
        ? "Awaiting Loan Review"
        : "Request Funding Review";

  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Borrower</p>
          <h3 className="mt-2 font-semibold max-w-[220px]">
            <AddressDisplay address={loan.borrower} />
          </h3>
        </div>
        <span className={`rounded-md bg-black/25 px-3 py-2 text-sm ${riskClass[loan.risk.riskLevel]}`}>
          {loan.risk.riskLabel}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-line bg-black/20 p-3">
        <p className="text-xs text-slate-500">Admin Status</p>
        <p className="mt-1 font-semibold text-aqua">{approvalText(loan)}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-500">Loan Amount</p>
          <p className="mt-1 font-semibold">{loan.amount} USDC</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Collateral Ratio</p>
          <p className="mt-1 font-semibold">{loan.risk.collateralRatio}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Lender Target Yield</p>
          <p className="mt-1 font-semibold">{loan.expectedYield}</p>
        </div>
      </div>

      <p className="mt-4 rounded-md bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {loan.risk.lenderVisibleReason}
      </p>
      <div className="mt-3 rounded-md border border-line bg-black/20 p-3 text-xs leading-5 text-slate-400">
        Public info: loan amount, collateral ratio, risk level, target yield. ZK privacy protected: yield ability, strategy exposure, default history, market volatility details only enter admin risk review.
      </div>
      <LenderDecisionPanel loan={loan} />
      <button
        onClick={() => {
          if (canRequestFunding) fundLoan(loan.id);
          setActiveLoanId(loan.id);
          if (loan.lenderApprovalStatus === "approved") router.push("/vault");
        }}
        disabled={!canRequestFunding && loan.lenderApprovalStatus !== "approved"}
        className="mt-5 w-full rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua transition hover:bg-aqua hover:text-ink disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600 disabled:hover:bg-transparent"
      >
        {buttonLabel}
      </button>
    </article>
  );
}
