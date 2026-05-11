import CurrentLoanSummary from "@/components/CurrentLoanSummary";
import DemoScenarioControls from "@/components/DemoScenarioControls";
import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import NextStepGuide from "@/components/NextStepGuide";
import OnChainPanel from "@/components/OnChainPanel";
import ProtocolFlow from "@/components/ProtocolFlow";
import Web3StatusPanel from "@/components/Web3StatusPanel";
import { useLoans } from "@/lib/LoanContext";

export default function Dashboard() {
  const { activeLoan, loans } = useLoans();
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalCollateral = loans.reduce((sum, loan) => sum + (loan.currentCollateral ?? loan.collateral), 0);
  const totalLockedProfit = loans.reduce((sum, loan) => sum + (loan.lenderProfitLocked ?? loan.repaid ?? 0), 0);
  const liquidationCount = loans.filter((loan) => loan.vaultStatus === "liquidated").length;

  return (
    <Layout>
      <section className="mb-7">
        <h1 className="text-2xl font-semibold">协议总览</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          当前 Demo 展示完整融资流程：借方申请、贷方放款、Vault 受控交易、收益锁定、亏损瀑布和结算退出。
          盈利时 5% 锁给贷方，95% 留在 Vault 继续交易。
        </p>
      </section>

      <div className="space-y-6">
        <Web3StatusPanel />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="活跃贷款数量" value={`${loans.length}`} />
          <MetricCard label="总借款金额" value={`${totalAmount.toFixed(2)} USDC`} tone="lime" />
          <MetricCard label="总抵押金额" value={`${totalCollateral.toFixed(2)} USDC`} tone="amber" />
          <MetricCard label="清算风险数量" value={`${liquidationCount}`} tone={liquidationCount > 0 ? "danger" : "aqua"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <CurrentLoanSummary loan={activeLoan} />
          <section className="rounded-lg border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">协议利润概览</p>
            <h2 className="mt-2 text-xl font-semibold">贷方锁定利润</h2>
            <p className="mt-4 text-4xl font-semibold text-aqua">{totalLockedProfit.toFixed(2)} USDC</p>
            <p className="mt-3 text-sm text-slate-400">
              这部分利润仍在 Vault 中，但已经从策略交易资金中隔离，借方不能继续拿它交易。
            </p>
          </section>
        </div>

        <DemoScenarioControls />
        <OnChainPanel />
        <ProtocolFlow />
        <NextStepGuide page="dashboard" />
      </div>
    </Layout>
  );
}
