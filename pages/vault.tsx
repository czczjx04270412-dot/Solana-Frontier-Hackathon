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
        <p className="text-xs uppercase tracking-wide text-aqua">VAULT MONITOR</p>
        <h1 className="mt-2 text-3xl font-semibold">Vault 实时运行</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
          这个页面只看资金库当前怎么运行：受控交易、资产白名单、实时净值、清算线和策略收益趋势。
          最终双方怎么分钱放在结算页面查看。
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="贷方本金保护线" value={`${activeLoan?.amount ?? 0} USDC`} />
        <MetricCard label="借方抵押余额" value={`${collateral.toFixed(2)} USDC`} tone="lime" />
        <MetricCard label="Vault 实时净值" value={`${activeLoan?.vaultNav.toFixed(2) ?? "0.00"} USDC`} tone="aqua" />
        <MetricCard label="贷方锁定利润" value={`${lockedProfit.toFixed(2)} USDC`} tone="amber" />
      </div>

      <div className="mt-6 space-y-6">
        <VaultFlowDiagram loan={activeLoan} />
        <VaultTradingPanel loan={activeLoan} />

        <section className="grid gap-6 lg:grid-cols-[0.72fr_1fr]">
          <div className="rounded-md border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">PROGRAMMABLE VAULT</p>
            <h2 className="mt-2 text-2xl font-semibold">可编程资金库</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              借方不能直接把资金转入个人钱包，只能通过受控交易面板执行白名单策略。
              盈利时 5% 锁入贷方利润池，95% 留在策略复投池；亏损时先扣复投池，再扣借方抵押。
            </p>
            <button
              onClick={() => accrueYield(1)}
              disabled={!canRunStrategy}
              className="mt-5 w-full rounded bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {isClosed ? "协议已结束" : canRunStrategy ? "运行 1 天随机盈亏" : "等待后台审核通过"}
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
