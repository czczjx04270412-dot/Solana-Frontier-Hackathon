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

  return (
    <Layout>
      <section className="mb-7">
        <p className="max-w-4xl text-lg font-medium text-slate-200">
          构建一个基于 Solana 的 DeFi 融资协议，结合 AI 风控、ZK 隐私展示和可编程 Vault，实现资金受控使用和自动还款的融资系统。
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="借款金额" value={`${activeLoan?.amount ?? 0} USDC`} />
        <MetricCard label="抵押金额" value={`${activeLoan?.collateral ?? 0} USDC`} tone="lime" />
        <MetricCard label="信用评分" value={`${activeLoan?.risk.creditScore ?? 0}`} tone="amber" />
        <MetricCard label="风险等级" value={activeLoan?.risk.riskLabel ?? "N/A"} tone={activeLoan?.risk.riskLevel === "high" || activeLoan?.risk.riskLevel === "liquidation" ? "danger" : "aqua"} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-6">
          <VaultFlowDiagram loan={activeLoan} />
          <YieldChart loan={activeLoan} />
        </div>
        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Demo Control</p>
            <h1 className="mt-2 text-2xl font-semibold">收益增长与还款</h1>
            <p className="mt-3 text-sm text-slate-400">
              点击后模拟 Vault 策略产生 1 天收益，每日 +2 USDC，并按 50/30/20 自动分配。
            </p>
            <button
              onClick={() => accrueYield(1)}
              className="mt-5 w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90"
            >
              模拟 1 天收益
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
