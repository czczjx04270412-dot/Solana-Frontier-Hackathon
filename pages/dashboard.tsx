import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import RepaymentProgress from "@/components/RepaymentProgress";
import VaultFlowDiagram from "@/components/VaultFlowDiagram";
import YieldChart from "@/components/YieldChart";
import ZKProofCard from "@/components/ZKProofCard";
import RiskFactorPanel from "@/components/RiskFactorPanel";
import CollateralRiskTable from "@/components/CollateralRiskTable";
import { useLoans } from "@/lib/LoanContext";

export default function Dashboard() {
  const { activeLoan, accrueYield } = useLoans();
  const collateral = activeLoan?.currentCollateral ?? activeLoan?.collateral ?? 0;

  return (
    <Layout>
      <section className="mb-7">
        <p className="max-w-4xl text-lg font-medium text-slate-200">
          Solana DeFi financing demo with AI risk scoring, ZK-style privacy display,
          controlled Vault usage, random strategy P/L, and automatic repayment.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Loan Amount" value={`${activeLoan?.amount ?? 0} USDC`} />
        <MetricCard label="Borrower Collateral" value={`${collateral.toFixed(2)} USDC`} tone="lime" />
        <MetricCard label="Risk Score" value={`${activeLoan?.risk.creditScore ?? 0}`} tone="amber" />
        <MetricCard
          label="Risk Level"
          value={activeLoan?.vaultStatus === "liquidated" ? "Liquidated" : activeLoan?.risk.riskLabel ?? "N/A"}
          tone={activeLoan?.vaultStatus === "liquidated" || activeLoan?.risk.riskLevel === "high" ? "danger" : "aqua"}
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-6">
          <VaultFlowDiagram loan={activeLoan} />
          <YieldChart loan={activeLoan} />
        </div>
        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Demo Control</p>
            <h1 className="mt-2 text-2xl font-semibold">Simulate 1 Day Strategy P/L</h1>
            <p className="mt-3 text-sm text-slate-400">
              Each click randomly generates profit or loss from -100U to +100U. Profit
              splits 50% repayment, 30% borrower, 20% lender. Loss is first absorbed
              by borrower collateral; below 120% collateral ratio triggers liquidation.
            </p>
            <button
              onClick={() => accrueYield(1)}
              disabled={activeLoan?.vaultStatus === "liquidated"}
              className="mt-5 w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {activeLoan?.vaultStatus === "liquidated" ? "Strategy Stopped" : "Simulate 1 Day P/L"}
            </button>
          </section>
          <RepaymentProgress loan={activeLoan} />
          <ZKProofCard />
          <RiskFactorPanel risk={activeLoan?.risk ?? null} />
          <CollateralRiskTable />
        </div>
      </div>
    </Layout>
  );
}
