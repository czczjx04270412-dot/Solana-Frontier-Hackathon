import CurrentLoanSummary from "@/components/CurrentLoanSummary";
import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import NextStepGuide from "@/components/NextStepGuide";
import ProtocolFlow from "@/components/ProtocolFlow";
import Web3StatusPanel from "@/components/Web3StatusPanel";
import { useLoans } from "@/lib/LoanContext";

export default function Dashboard() {
  const { activeLoan, loans } = useLoans();
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalCollateral = loans.reduce((sum, loan) => sum + (loan.currentCollateral ?? loan.collateral), 0);
  const totalLockedProfit = loans.reduce((sum, loan) => sum + (loan.lenderProfitLocked ?? loan.repaid ?? 0), 0);
  const borrowerPending = loans.filter((loan) => loan.borrowerApprovalStatus === "pending").length;
  const lenderPending = loans.filter((loan) => loan.lenderApprovalStatus === "pending").length;

  return (
    <Layout>
      <section className="mb-6 rounded-md border border-line bg-panel p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-wide text-aqua">SOLANA CREDIT VAULT</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">受控资金使用的链上融资 Demo</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              借方申请融资，后台通过 AI/ZK 风控后进入贷方市场；贷方放款还需要后台复核，资金才会进入 Vault。
              Vault 负责限制交易范围、监控清算线，并在利润达标后完成结算退出。
            </p>
          </div>
          <div className="rounded-md bg-ink p-4">
            <p className="text-sm text-slate-500">当前演示阶段</p>
            <p className="mt-2 text-2xl font-semibold text-aqua">
              {activeLoan?.vaultStatus === "strategy" ? "Vault 策略运行中" : "等待流程推进"}
            </p>
            <p className="mt-2 text-sm text-slate-500">建议按下方流程从左到右演示。</p>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <Web3StatusPanel />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="贷款工单" value={`${loans.length}`} note="当前 Demo 中的借款申请数量" />
          <MetricCard label="融资本金" value={`${totalAmount.toFixed(2)} USDC`} tone="lime" />
          <MetricCard label="抵押余额" value={`${totalCollateral.toFixed(2)} USDC`} tone="amber" />
          <MetricCard label="待后台处理" value={`${borrowerPending + lenderPending}`} tone={borrowerPending + lenderPending > 0 ? "amber" : "aqua"} />
        </div>

        <ProtocolFlow />

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <CurrentLoanSummary loan={activeLoan} />
          <section className="rounded-md border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">PROFIT LOCK</p>
            <h2 className="mt-2 text-xl font-semibold">贷方锁定利润</h2>
            <p className="mt-4 text-4xl font-semibold text-aqua">{totalLockedProfit.toFixed(2)} USDC</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              盈利时只有 5% 进入贷方利润锁定池，剩余 95% 继续留在策略复投池。锁定利润不再参与交易亏损。
            </p>
          </section>
        </div>

        <NextStepGuide page="dashboard" />
      </div>
    </Layout>
  );
}
