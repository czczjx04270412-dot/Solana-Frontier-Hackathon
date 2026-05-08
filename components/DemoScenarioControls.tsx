import { useLoans } from "@/lib/LoanContext";

const scenarios = [
  { id: "profit" as const, label: "盈利场景", description: "模拟 Vault 单日上涨 8%" },
  { id: "loss" as const, label: "亏损场景", description: "模拟 Vault 单日回撤 7%" },
  { id: "liquidation" as const, label: "清算场景", description: "模拟极端下跌并触发风控" },
  { id: "exit" as const, label: "达标退出", description: "模拟贷方目标利润达标" }
];

export default function DemoScenarioControls() {
  const { runDemoScenario, resetDemo } = useLoans();

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">DEMO SCENARIOS</p>
          <h2 className="mt-2 text-xl font-semibold">一键演示场景</h2>
          <p className="mt-2 text-sm text-slate-400">用于比赛演示，避免随机收益影响讲解节奏。</p>
        </div>
        <button onClick={resetDemo} className="rounded-md border border-danger/60 px-4 py-3 font-semibold text-danger transition hover:bg-danger/10">
          重置 Demo 数据
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => runDemoScenario(scenario.id)}
            className="rounded-lg border border-line bg-black/20 p-4 text-left transition hover:border-aqua/60 hover:bg-aqua/10"
          >
            <span className="block font-semibold text-slate-100">{scenario.label}</span>
            <span className="mt-2 block text-sm leading-5 text-slate-500">{scenario.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
