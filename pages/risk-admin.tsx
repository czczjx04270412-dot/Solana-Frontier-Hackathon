import CurrentLoanSummary from "@/components/CurrentLoanSummary";
import AddressDisplay from "@/components/AddressDisplay";
import Layout from "@/components/Layout";
import RiskFactorPanel from "@/components/RiskFactorPanel";
import ZKProofCard from "@/components/ZKProofCard";
import CollateralRiskTable from "@/components/CollateralRiskTable";
import { useLoans } from "@/lib/LoanContext";
import type { Loan } from "@/lib/types";

function money(value: number) {
  return `${value.toFixed(2)} USDC`;
}

function approvalBadge(status: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending";
  return "Not Initiated";
}

function ApprovalCard({ loan }: { loan: Loan }) {
  const { reviewBorrowerRequest, reviewLenderRequest, setActiveLoanId } = useLoans();
  const liquidationLine = loan.amount * 1.2;
  const safeDistance = loan.vaultNav - liquidationLine;

  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Risk Control Ticket</p>
          <h3 className="mt-2 text-xl font-semibold max-w-[320px]">
            <AddressDisplay address={loan.borrower} />
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Admin confirms whether the loan can enter the lender market and whether lender funding can enter the Vault. Funds cannot enter strategy trading until admin confirms.
          </p>
        </div>
        <button
          onClick={() => setActiveLoanId(loan.id)}
          className="rounded-md border border-aqua/50 px-3 py-2 text-sm font-semibold text-aqua transition hover:bg-aqua hover:text-ink"
        >
          Set as Active Loan
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Loan Amount</p>
          <p className="mt-1 font-semibold">{money(loan.amount)}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Collateral Ratio</p>
          <p className="mt-1 font-semibold">{loan.risk.collateralRatio}%</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Risk Level</p>
          <p className="mt-1 font-semibold text-amber">{loan.risk.riskLabel}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Liquidation Safe Distance</p>
          <p className={safeDistance >= 0 ? "mt-1 font-semibold text-lime" : "mt-1 font-semibold text-danger"}>
            {money(safeDistance)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-black/15 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Step 1: Loan Admission Review</p>
              <p className="mt-1 font-semibold">{approvalBadge(loan.borrowerApprovalStatus)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => reviewBorrowerRequest(loan.id, "approved")}
                disabled={loan.borrowerApprovalStatus === "approved"}
                className="rounded-md bg-aqua px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={() => reviewBorrowerRequest(loan.id, "rejected")}
                disabled={loan.borrowerApprovalStatus === "rejected"}
                className="rounded-md border border-danger/50 px-3 py-2 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Review focus: collateral ratio meets threshold, AI risk score is reasonable, ZK privacy proof is valid, strategy is within allowed range.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-black/15 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Step 2: Lender Funding Review</p>
              <p className="mt-1 font-semibold">{approvalBadge(loan.lenderApprovalStatus)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => reviewLenderRequest(loan.id, "approved")}
                disabled={loan.borrowerApprovalStatus !== "approved" || loan.lenderApprovalStatus !== "pending"}
                className="rounded-md bg-lime px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm into Vault
              </button>
              <button
                onClick={() => reviewLenderRequest(loan.id, "rejected")}
                disabled={loan.borrowerApprovalStatus !== "approved" || loan.lenderApprovalStatus !== "pending"}
                className="rounded-md border border-danger/50 px-3 py-2 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject Funding
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            After lender clicks fund, it only initiates a request for funds to enter the Vault. After admin confirms, funds enter the controlled account and borrower can execute whitelisted strategies.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {loan.risk.aiReason}
      </div>
    </article>
  );
}

export default function RiskAdminPage() {
  const { loans, activeLoan } = useLoans();
  const borrowerPending = loans.filter((loan) => loan.borrowerApprovalStatus === "pending").length;
  const lenderPending = loans.filter((loan) => loan.lenderApprovalStatus === "pending").length;
  const warningCount = loans.filter((loan) => loan.vaultNav - loan.amount * 1.2 < 150).length;

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="text-2xl font-semibold">Admin Risk Control</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          This is the admin approval console. Borrower applications must pass loan admission review first; after lender funding, a funding review is also required before funds can enter the Vault and market strategy.
        </p>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">Loan Pending Review</p>
          <p className="mt-2 text-2xl font-semibold text-amber">{borrowerPending}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">Funding Pending Review</p>
          <p className="mt-2 text-2xl font-semibold text-aqua">{lenderPending}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">Risk Warning</p>
          <p className="mt-2 text-2xl font-semibold text-danger">{warningCount}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">All Tickets</p>
          <p className="mt-2 text-2xl font-semibold text-lime">{loans.length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          {loans.map((loan) => (
            <ApprovalCard key={loan.id} loan={loan} />
          ))}
        </div>
        <div className="space-y-6">
          <CurrentLoanSummary loan={activeLoan} />
          <ZKProofCard />
          <CollateralRiskTable />
          <RiskFactorPanel risk={activeLoan?.risk ?? null} />
        </div>
      </div>
    </Layout>
  );
}
