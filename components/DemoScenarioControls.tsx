import { useLoans } from "@/lib/LoanContext";

const scenarios = [
  {
    id: "profit" as const,
    label: "Normal Profit",
    description: "Simulates Vault daily gain of 8%. 5% profit enters lender lock pool, 95% stays in strategy reinvest pool."
  },
  {
    id: "loss" as const,
    label: "Loss Warning",
    description: "Simulates Vault drawdown of 7%. Strategy pool absorbs first, then borrower collateral is affected."
  },
  {
    id: "liquidation" as const,
    label: "Liquidation Trigger",
    description: "Simulates extreme drop, Vault NAV falls below 120% of lender principal, triggering liquidation and stopping strategy."
  },
  {
    id: "exit" as const,
    label: "Repayment Success",
    description: "Simulates lender profit lock pool reaching target profit. Protocol enters repaid state, borrower can withdraw."
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
          <h2 className="mt-2 text-2xl font-semibold">One-Click Demo Scenarios</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Click preset scenarios for live demo. Each button changes Vault NAV, profit pool, liquidation status or repayment state.
          </p>
        </div>
        <button
          onClick={resetDemo}
          className="rounded-md border border-danger/60 px-4 py-3 font-semibold text-danger transition hover:bg-danger/10"
        >
          Reset Demo Data
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
