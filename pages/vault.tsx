import DemoScenarioControls from "@/components/DemoScenarioControls";
import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import NextStepGuide from "@/components/NextStepGuide";
import VaultFlowDiagram from "@/components/VaultFlowDiagram";
import VaultTradingPanel from "@/components/VaultTradingPanel";
import YieldChart from "@/components/YieldChart";
import { useLoans } from "@/lib/LoanContext";

export default function VaultPage() {
  const { activeLoan, accrueYield } = useLoans();
  const collateral = activeLoan?.currentCollateral ?? activeLoan?.collateral ?? 0;
  const lockedProfit = activeLoan?.lenderProfitLocked ?? activeLoan?.repaid ?? 0;
  const isClosed =
    activeLoan?.vaultStatus === "liquidated" ||
    activeLoan?.vaultStatus === "repaid" ||
    activeLoan?.vaultStatus === "withdrawn";
  const canRunStrategy =
    activeLoan?.borrowerApprovalStatus === "approved" &&
    activeLoan?.lenderApprovalStatus === "approved" &&
    activeLoan?.funded &&
    !isClosed;

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="text-2xl font-semibold">Vault Live Operations</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          This page shows how the Vault operates in real-time: controlled trading, asset whitelist, live NAV, liquidation line, and strategy yield trends.
          Final profit distribution is on the Settlement page.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Protected Lender Principal" value={`${activeLoan?.amount ?? 0} USDC`} />
        <MetricCard label="Borrower Collateral Balance" value={`${collateral.toFixed(2)} USDC`} tone="lime" />
        <MetricCard label="Vault Real-time NAV" value={`${activeLoan?.vaultNav.toFixed(2) ?? "0.00"} USDC`} tone="aqua" />
        <MetricCard label="Lender Locked Profit" value={`${lockedProfit.toFixed(2)} USDC`} tone="amber" />
      </div>

      <div className="mt-6 space-y-6">
        <VaultFlowDiagram loan={activeLoan} />
        <VaultTradingPanel loan={activeLoan} />

        <section className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <div className="rounded-lg border border-line bg-panel p-5 shadow-glow">
            <p className="text-xs uppercase tracking-wide text-slate-500">PROGRAMMABLE VAULT</p>
            <h2 className="mt-2 text-2xl font-semibold">Programmable Vault</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Borrower cannot transfer funds to personal wallet, only execute whitelisted strategies via controlled trading panel.
              On profit, 5% locked for lender, 95% stays in strategy reinvest pool; on loss, reinvest pool is deducted first, then borrower collateral.
            </p>
            <button
              onClick={() => accrueYield(1)}
              disabled={!canRunStrategy}
              className="mt-5 w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {isClosed ? "Protocol Ended" : canRunStrategy ? "Run 1-Day Random P&L" : "Awaiting Admin Approval"}
            </button>
          </div>
          <YieldChart loan={activeLoan} />
        </section>

        <DemoScenarioControls />
        <NextStepGuide page="vault" />
      </div>
    </Layout>
  );
}
