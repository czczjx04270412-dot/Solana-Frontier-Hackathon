import { useLoans } from "@/lib/LoanContext";

const scenarios = [
  {
    id: "profit" as const,
    label: "正常盈利",
    description: "模拟 Vault 单日上涨 8%，5% 利润进入贷方锁定池，95% 留在策略复投池。"
  },
  {
    id: "loss" as const,
    label: "连续亏损预警",
    description: "模拟 Vault 回撤 7%，先扣策略复投池，再影响借方抵押，观察安全距离变化。"
  },
  {
    id: "liquidation" as const,
    label: "达到清算线",
    description: "模拟极端下跌，使 Vault 净值低于贷方本金 120%，触发清算并停止策略。"
  },
  {
    id: "exit" as const,
    label: "还款利润成功",
    description: "模拟贷方利润锁定池达到目标利润，协议进入已还清状态，借方可选择出金。"
  }
];

export default function DemoScenarioControls() {
  const { activeLoan, runDemoScenario, resetDemo } = useLoans();
  const canRunScenario =
    activeLoan?.borrowerApprovalStatus === "approved" &&
    activeLoan?.lenderApprovalStatus === "approved" &&
    activeLoan?.funded &&
    activeLoan?.vaultStatus !== "liquidated" &&
    activeLoan?.vaultStatus !== "repaid" &&
    activeLoan?.vaultStatus !== "withdrawn";

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-glow">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">DEMO SCENARIOS</p>
          <h2 className="mt-2 text-2xl font-semibold">一键演示场景</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            比赛讲解时可以直接点击预设场景，不用等随机收益慢慢跑出来。每个按钮都会改变 Vault 净值、利润池、清算状态或还款状态。
          </p>
        </div>
        <button
          onClick={resetDemo}
          className="rounded-md border border-danger/60 px-4 py-3 font-semibold text-danger transition hover:bg-danger/10"
        >
          重置 Demo 数据
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => runDemoScenario(scenario.id)}
            disabled={!canRunScenario}
            className="rounded-lg border border-line bg-black/20 p-4 text-left transition hover:border-aqua/60 hover:bg-aqua/10 disabled:cursor-not-allowed disabled:border-slate-800 disabled:opacity-45 disabled:hover:bg-black/20"
          >
            <span className="block text-lg font-semibold text-slate-100">{scenario.label}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-500">{scenario.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
