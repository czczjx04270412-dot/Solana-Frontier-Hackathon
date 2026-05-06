import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import VaultFlowDiagram from "@/components/VaultFlowDiagram";
import YieldChart from "@/components/YieldChart";
import { useLoans } from "@/lib/LoanContext";

export default function VaultPage() {
  const { activeLoan, accrueYield } = useLoans();

  return (
    <Layout>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Vault Balance" value={`${activeLoan?.amount ?? 0} USDC`} />
        <MetricCard label="Current Yield" value={`${activeLoan?.currentYield.toFixed(2) ?? "0.00"} USDC`} tone="lime" />
        <MetricCard label="Vault Rule" value="Strategy Only" tone="amber" />
      </div>
      <div className="mt-6 space-y-6">
        <VaultFlowDiagram loan={activeLoan} />
        <section className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <div className="rounded-lg border border-line bg-panel p-5">
            <h1 className="text-2xl font-semibold">Programmable Vault</h1>
            <p className="mt-3 text-sm text-slate-400">
              Demo 规则：借款资金不直接转入用户钱包，只能进入模拟策略，策略收益再进入自动还款流程。
            </p>
            <button
              onClick={() => accrueYield(1)}
              className="mt-5 w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90"
            >
              运行策略收益
            </button>
          </div>
          <YieldChart loan={activeLoan} />
        </section>
      </div>
    </Layout>
  );
}
