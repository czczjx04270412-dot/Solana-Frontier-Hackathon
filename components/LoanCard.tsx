import { useRouter } from "next/router";
import type { Loan } from "@/lib/types";
import { useLoans } from "@/lib/LoanContext";
import LenderDecisionPanel from "./LenderDecisionPanel";

const riskClass = {
  "very-low": "text-lime",
  low: "text-lime",
  medium: "text-amber",
  elevated: "text-orange-300",
  high: "text-danger",
  liquidation: "text-danger"
};

function approvalText(loan: Loan) {
  if (loan.borrowerApprovalStatus === "pending") return "借款待风控审核";
  if (loan.borrowerApprovalStatus === "rejected") return "借款已被拒绝";
  if (loan.lenderApprovalStatus === "pending") return "放款待风控审核";
  if (loan.lenderApprovalStatus === "rejected") return "放款已被拒绝";
  if (loan.lenderApprovalStatus === "approved") return "已通过，资金进入 Vault";
  return "可发起放款";
}

export default function LoanCard({ loan }: { loan: Loan }) {
  const { fundLoan, setActiveLoanId } = useLoans();
  const router = useRouter();
  const canRequestFunding = loan.borrowerApprovalStatus === "approved" && loan.lenderApprovalStatus === "not-started";
  const buttonLabel = loan.lenderApprovalStatus === "pending"
    ? "等待后台确认放款"
    : loan.lenderApprovalStatus === "approved"
      ? "查看 Vault"
      : loan.borrowerApprovalStatus === "pending"
        ? "等待借款审核"
        : "发起放款审核";

  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">借款人</p>
          <h3 className="mt-2 font-semibold">{loan.borrower}</h3>
        </div>
        <span className={`rounded-md bg-black/25 px-3 py-2 text-sm ${riskClass[loan.risk.riskLevel]}`}>
          {loan.risk.riskLabel}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-line bg-black/20 p-3">
        <p className="text-xs text-slate-500">后台状态</p>
        <p className="mt-1 font-semibold text-aqua">{approvalText(loan)}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-500">借款金额</p>
          <p className="mt-1 font-semibold">{loan.amount} USDC</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">公开抵押率</p>
          <p className="mt-1 font-semibold">{loan.risk.collateralRatio}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">贷方目标收益</p>
          <p className="mt-1 font-semibold">{loan.expectedYield}</p>
        </div>
      </div>

      <p className="mt-4 rounded-md bg-black/20 p-3 text-sm leading-6 text-slate-300">
        {loan.risk.lenderVisibleReason}
      </p>
      <div className="mt-3 rounded-md border border-line bg-black/20 p-3 text-xs leading-5 text-slate-400">
        公开信息：借款金额、抵押率、风险等级、目标收益。ZK 隐私保护：收益能力、策略暴露、违约历史、市场波动等细节只进入后台风控。
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
