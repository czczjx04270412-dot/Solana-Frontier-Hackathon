import { useEffect, useMemo, useState } from "react";
import CollateralRiskTable from "@/components/CollateralRiskTable";
import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import RiskFactorPanel from "@/components/RiskFactorPanel";
import ZKProofCard from "@/components/ZKProofCard";
import { useLoans } from "@/lib/LoanContext";
import type { Loan } from "@/lib/types";

const pageSize = 5;

function money(value: number) {
  return `${value.toFixed(2)} USDC`;
}

function approvalText(status: string) {
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已拒绝";
  if (status === "pending") return "待审核";
  return "未发起";
}

function tone(status: string) {
  if (status === "approved") return "text-lime";
  if (status === "rejected") return "text-danger";
  if (status === "pending") return "text-amber";
  return "text-slate-500";
}

function ticketStatus(loan: Loan) {
  if (loan.borrowerApprovalStatus === "pending") return "借款待审核";
  if (loan.borrowerApprovalStatus === "rejected") return "借款已拒绝";
  if (loan.lenderApprovalStatus === "pending") return "放款待审核";
  if (loan.lenderApprovalStatus === "rejected") return "放款已拒绝";
  if (loan.lenderApprovalStatus === "approved") return "已入 Vault";
  return "等待贷方";
}

export default function RiskAdminPage() {
  const {
    loans,
    activeLoan,
    reviewBorrowerRequest,
    reviewLenderRequest,
    setActiveLoanId
  } = useLoans();
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(loans.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedLoans = useMemo(
    () => loans.slice((safePage - 1) * pageSize, safePage * pageSize),
    [loans, safePage]
  );
  const selectedLoan = activeLoan ?? loans[0] ?? null;
  const borrowerPending = loans.filter((loan) => loan.borrowerApprovalStatus === "pending").length;
  const lenderPending = loans.filter((loan) => loan.lenderApprovalStatus === "pending").length;
  const warningCount = loans.filter((loan) => loan.vaultNav - loan.amount * 1.2 < 150).length;

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Layout>
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-aqua">RISK ADMIN</p>
        <h1 className="mt-2 text-3xl font-semibold">后台风控审批台</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
          借款申请和贷方放款都必须经过后台确认。左侧是工单队列，右侧是当前工单详情和审批操作。
        </p>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="借款待审核" value={`${borrowerPending}`} tone={borrowerPending > 0 ? "amber" : "aqua"} />
        <MetricCard label="放款待审核" value={`${lenderPending}`} tone={lenderPending > 0 ? "amber" : "aqua"} />
        <MetricCard label="风险预警" value={`${warningCount}`} tone={warningCount > 0 ? "danger" : "lime"} />
        <MetricCard label="全部工单" value={`${loans.length}`} />
      </div>

      <section className="overflow-hidden rounded-md border border-line bg-panel">
        <div className="grid min-h-[680px] xl:grid-cols-[380px_1fr]">
          <aside className="flex min-h-[680px] flex-col border-b border-line bg-ink/55 xl:border-b-0 xl:border-r">
            <div className="border-b border-line p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">TICKET QUEUE</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <h2 className="text-lg font-semibold">风控工单队列</h2>
                <span className="text-xs text-slate-500">
                  第 {safePage} / {pageCount} 页
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-line overflow-hidden">
              {pagedLoans.map((loan) => {
                const active = selectedLoan?.id === loan.id;
                const safeDistance = loan.vaultNav - loan.amount * 1.2;
                return (
                  <button
                    key={loan.id}
                    onClick={() => setActiveLoanId(loan.id)}
                    className={`block w-full p-4 text-left transition ${
                      active ? "bg-aqua/10" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">{loan.borrower}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{loan.id}</p>
                      </div>
                      <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${active ? "bg-aqua text-ink" : "bg-panel text-aqua"}`}>
                        {ticketStatus(loan)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <QueueMetric label="金额" value={money(loan.amount)} />
                      <QueueMetric label="评分" value={`${loan.risk.creditScore}`} />
                      <QueueMetric label="安全距" value={money(safeDistance)} danger={safeDistance < 150} />
                    </div>
                  </button>
                );
              })}

              {pagedLoans.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">暂无工单</div>
              ) : null}
            </div>

            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          </aside>

          <div className="p-5">
            {selectedLoan ? (
              <TicketDetail
                loan={selectedLoan}
                onApproveBorrower={() => reviewBorrowerRequest(selectedLoan.id, "approved")}
                onRejectBorrower={() => reviewBorrowerRequest(selectedLoan.id, "rejected")}
                onApproveLender={() => reviewLenderRequest(selectedLoan.id, "approved")}
                onRejectLender={() => reviewLenderRequest(selectedLoan.id, "rejected")}
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-500">暂无工单</div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ZKProofCard />
        <RiskFactorPanel risk={selectedLoan?.risk ?? null} />
      </section>

      <div className="mt-6">
        <CollateralRiskTable />
      </div>
    </Layout>
  );
}

function TicketDetail({
  loan,
  onApproveBorrower,
  onRejectBorrower,
  onApproveLender,
  onRejectLender
}: {
  loan: Loan;
  onApproveBorrower: () => void;
  onRejectBorrower: () => void;
  onApproveLender: () => void;
  onRejectLender: () => void;
}) {
  const liquidationLine = loan.amount * 1.2;
  const safeDistance = loan.vaultNav - liquidationLine;
  const borrowerCanReview = loan.borrowerApprovalStatus !== "approved";
  const lenderCanReview = loan.borrowerApprovalStatus === "approved" && loan.lenderApprovalStatus === "pending";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">SELECTED TICKET</p>
          <h2 className="mt-2 text-2xl font-semibold">{loan.borrower}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            当前工单需要完成两次确认：先判断借方是否可以进入贷方市场，再判断贷方资金是否可以进入受控 Vault。
          </p>
        </div>
        <span className="rounded bg-aqua/10 px-4 py-3 text-sm font-semibold text-aqua">{ticketStatus(loan)}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <DetailMetric label="借款金额" value={money(loan.amount)} />
        <DetailMetric label="抵押率" value={`${loan.risk.collateralRatio}%`} />
        <DetailMetric label="风险等级" value={loan.risk.riskLabel} tone="text-amber" />
        <DetailMetric label="安全距离" value={money(safeDistance)} tone={safeDistance >= 0 ? "text-lime" : "text-danger"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewPanel
          title="借款准入审核"
          status={loan.borrowerApprovalStatus}
          body="检查抵押率、AI 评分、ZK 证明、策略范围和清算安全距离。通过后，该借款才会进入贷方决策流程。"
          primaryLabel="通过借款"
          secondaryLabel="拒绝借款"
          primaryDisabled={!borrowerCanReview || loan.borrowerApprovalStatus === "approved"}
          secondaryDisabled={loan.borrowerApprovalStatus === "rejected"}
          onPrimary={onApproveBorrower}
          onSecondary={onRejectBorrower}
        />
        <ReviewPanel
          title="放款入 Vault 审核"
          status={loan.lenderApprovalStatus}
          body="贷方点击放款后，还需要后台确认资金进入受控 Vault。通过后，借方才可以使用白名单策略交易。"
          primaryLabel="确认入 Vault"
          secondaryLabel="拒绝放款"
          primaryDisabled={!lenderCanReview}
          secondaryDisabled={!lenderCanReview}
          onPrimary={onApproveLender}
          onSecondary={onRejectLender}
        />
      </div>

      <section className="rounded-md border border-line bg-ink p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">AI RISK EXPLANATION</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{loan.risk.aiReason}</p>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <DetailMetric label="Vault 净值" value={money(loan.vaultNav)} tone="text-aqua" />
        <DetailMetric label="清算线" value={money(liquidationLine)} tone="text-amber" />
        <DetailMetric label="贷方目标利润" value={money(loan.interestDue)} tone="text-lime" />
      </div>
    </div>
  );
}

function ReviewPanel({
  title,
  status,
  body,
  primaryLabel,
  secondaryLabel,
  primaryDisabled,
  secondaryDisabled,
  onPrimary,
  onSecondary
}: {
  title: string;
  status: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryDisabled: boolean;
  secondaryDisabled: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <section className="rounded-md border border-line bg-ink p-4">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className={`mt-1 text-sm font-semibold ${tone(status)}`}>{approvalText(status)}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="rounded bg-aqua px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {primaryLabel}
        </button>
        <button
          onClick={onSecondary}
          disabled={secondaryDisabled}
          className="rounded border border-danger/50 px-4 py-2 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-40"
        >
          {secondaryLabel}
        </button>
      </div>
    </section>
  );
}

function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="border-t border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded border border-line px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          上一页
        </button>
        {pages.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`h-9 min-w-9 rounded px-3 text-sm font-semibold ${
              item === page ? "bg-aqua text-ink" : "border border-line text-slate-400 hover:text-slate-100"
            }`}
          >
            {item}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="rounded border border-line px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function QueueMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className={`mt-1 truncate font-semibold ${danger ? "text-danger" : "text-slate-200"}`}>{value}</p>
    </div>
  );
}

function DetailMetric({ label, value, tone = "text-slate-100" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-ink p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
