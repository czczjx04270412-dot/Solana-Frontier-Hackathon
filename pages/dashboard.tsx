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
        <h1 className="text-2xl font-semibold">Protocol Overview</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          This demo shows the full financing flow: borrower application, lender funding, Vault controlled trading, profit locking, loss waterfall, and settlement exit.
          On profit, 5% is locked for lender, 95% stays in Vault for trading.
        </p>
      </section>

      <div className="space-y-6">
        <Web3StatusPanel />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active Loans" value={`${loans.length}`} />
          <MetricCard label="Total Loan Amount" value={`${totalAmount.toFixed(2)} USDC`} tone="lime" />
          <MetricCard label="Total Collateral" value={`${totalCollateral.toFixed(2)} USDC`} tone="amber" />
          <MetricCard label="Liquidation Risk Count" value={`${liquidationCount}`} tone={liquidationCount > 0 ? "danger" : "aqua"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <CurrentLoanSummary loan={activeLoan} />
          <section className="rounded-lg border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Protocol Profit Overview</p>
            <h2 className="mt-2 text-xl font-semibold">Lender Locked Profit</h2>
            <p className="mt-4 text-4xl font-semibold text-aqua">{totalLockedProfit.toFixed(2)} USDC</p>
            <p className="mt-3 text-sm text-slate-400">
              This profit remains in the Vault but is isolated from strategy trading funds. Borrower cannot use it for trading.
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
