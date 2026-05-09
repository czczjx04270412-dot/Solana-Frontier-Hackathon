import type { Loan } from "@/lib/types";

function statusText(loan: Loan | null) {
  if (!loan) return "暂无贷款";
  if (loan.vaultStatus === "liquidated") return "已清算";
  if (loan.vaultStatus === "repaid") return "利润达标";
  if (loan.vaultStatus === "withdrawn") return "已出金";
  if (loan.vaultStatus === "loss") return "亏损处理中";
  if (loan.vaultStatus === "strategy") return "策略运行中";
  if (loan.vaultStatus === "funded") return "已放款";
  if (loan.borrowerApprovalStatus === "pending") return "借款待审核";
  if (loan.lenderApprovalStatus === "pending") return "放款待审核";
  return "等待放款";
}

export default function CurrentLoanSummary({ loan }: { loan: Loan | null }) {
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const ratio = loan?.amount ? Math.round((collateral / loan.amount) * 100) : 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const liquidationLine = (loan?.amount ?? 0) * 1.2;
  const safeDistance = (loan?.vaultNav ?? 0) - liquidationLine;

  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">CURRENT LOAN</p>
          <h2 className="mt-2 text-xl font-semibold">{statusText(loan)}</h2>
        </div>
        <span className="rounded bg-aqua/10 px-3 py-2 text-sm font-semibold text-aqua">
          {loan?.risk.riskLabel ?? "暂无风险"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryItem label="借款金额" value={`${(loan?.amount ?? 0).toFixed(2)} USDC`} />
        <SummaryItem label="当前抵押" value={`${collateral.toFixed(2)} USDC`} tone="text-lime" />
        <SummaryItem label="抵押率" value={`${ratio}%`} tone={ratio < 120 ? "text-danger" : "text-amber"} />
        <SummaryItem label="锁定利润" value={`${lockedProfit.toFixed(2)} USDC`} tone="text-aqua" />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SummaryItem label="Vault 净值" value={`${(loan?.vaultNav ?? 0).toFixed(2)} USDC`} tone="text-aqua" />
        <SummaryItem label="清算安全距离" value={`${safeDistance.toFixed(2)} USDC`} tone={safeDistance >= 0 ? "text-lime" : "text-danger"} />
      </div>
    </section>
  );
}

function SummaryItem({ label, value, tone = "text-slate-100" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-ink p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
