import CurrentLoanSummary from "@/components/CurrentLoanSummary";
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
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已拒绝";
  if (status === "pending") return "待审核";
  return "未发起";
}

function ApprovalCard({ loan }: { loan: Loan }) {
  const { reviewBorrowerRequest, reviewLenderRequest, setActiveLoanId } = useLoans();
  const liquidationLine = loan.amount * 1.2;
  const safeDistance = loan.vaultNav - liquidationLine;

  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">风控工单</p>
          <h3 className="mt-2 text-xl font-semibold">{loan.borrower}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            后台负责确认借款是否可以进入贷方市场，以及贷方放款是否可以进入 Vault。未通过后台确认前，资金不能进入策略交易。
          </p>
        </div>
        <button
          onClick={() => setActiveLoanId(loan.id)}
          className="rounded-md border border-aqua/50 px-3 py-2 text-sm font-semibold text-aqua transition hover:bg-aqua hover:text-ink"
        >
          设为当前贷款
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">借款金额</p>
          <p className="mt-1 font-semibold">{money(loan.amount)}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">抵押率</p>
          <p className="mt-1 font-semibold">{loan.risk.collateralRatio}%</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">风险等级</p>
          <p className="mt-1 font-semibold text-amber">{loan.risk.riskLabel}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">清算安全距离</p>
          <p className={safeDistance >= 0 ? "mt-1 font-semibold text-lime" : "mt-1 font-semibold text-danger"}>
            {money(safeDistance)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-black/15 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">第一步：借款准入审核</p>
              <p className="mt-1 font-semibold">{approvalBadge(loan.borrowerApprovalStatus)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => reviewBorrowerRequest(loan.id, "approved")}
                disabled={loan.borrowerApprovalStatus === "approved"}
                className="rounded-md bg-aqua px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                通过
              </button>
              <button
                onClick={() => reviewBorrowerRequest(loan.id, "rejected")}
                disabled={loan.borrowerApprovalStatus === "rejected"}
                className="rounded-md border border-danger/50 px-3 py-2 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                拒绝
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            审核重点：抵押率是否达标、AI 风险评分是否合理、ZK 隐私证明是否有效、策略是否属于允许范围。
          </p>
        </div>

        <div className="rounded-lg border border-line bg-black/15 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">第二步：贷方放款审核</p>
              <p className="mt-1 font-semibold">{approvalBadge(loan.lenderApprovalStatus)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => reviewLenderRequest(loan.id, "approved")}
                disabled={loan.borrowerApprovalStatus !== "approved" || loan.lenderApprovalStatus !== "pending"}
                className="rounded-md bg-lime px-3 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                确认入 Vault
              </button>
              <button
                onClick={() => reviewLenderRequest(loan.id, "rejected")}
                disabled={loan.borrowerApprovalStatus !== "approved" || loan.lenderApprovalStatus !== "pending"}
                className="rounded-md border border-danger/50 px-3 py-2 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                拒绝放款
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            贷方点击放款后，只是发起资金进入 Vault 的请求。后台确认后，资金才会进入受控账户，借方才可以执行白名单策略。
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
        <h1 className="text-2xl font-semibold">后台风控视角</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          这里是平台工作人员使用的审批台。借方申请必须先通过借款准入审核；贷方放款成功后，还要经过放款审核，确认后资金才能进入 Vault 和市场策略。
        </p>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">借款待审核</p>
          <p className="mt-2 text-2xl font-semibold text-amber">{borrowerPending}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">放款待审核</p>
          <p className="mt-2 text-2xl font-semibold text-aqua">{lenderPending}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">风险预警</p>
          <p className="mt-2 text-2xl font-semibold text-danger">{warningCount}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-slate-500">全部工单</p>
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
