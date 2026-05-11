const steps = [
  {
    title: "1. Borrower Applies for Financing",
    body: "Borrower connects wallet and submits loan amount and collateral. System generates risk score based on collateral ratio, yield ability, strategy risk, and market volatility."
  },
  {
    title: "2. AI / ZK Risk Assessment",
    body: "Lender can see risk level, recommended target yield, and explainable AI risk summary. Admin risk control can view more complete private risk factors."
  },
  {
    title: "3. Lender Funds",
    body: "After lender confirms risk and target yield, funds are sent. Lender principal and borrower collateral jointly enter the controlled Vault."
  },
  {
    title: "4. Vault Controlled Trading",
    body: "Borrower cannot withdraw funds directly, only execute whitelisted strategies (e.g. buy/sell SOL) via the platform's controlled trading panel."
  },
  {
    title: "5. Real-time NAV Monitoring",
    body: "System continuously calculates Vault real-time NAV, liquidation line, distance to liquidation, daily/weekly/monthly yield."
  },
  {
    title: "6. Profit Distribution",
    body: "Daily profit split 5% / 95%: 5% enters lender profit lock pool, 95% stays in strategy reinvest pool for continued trading."
  },
  {
    title: "7. Loss Waterfall",
    body: "Loss deducted from strategy reinvest pool first, then borrower collateral. Lender profit lock pool and lender principal protection are never deducted."
  },
  {
    title: "8. Protocol Exit",
    body: "When the lender profit lock pool reaches target profit and Vault NAV is sufficient to cover lender principal + locked profit, the protocol can settle and exit."
  }
];

const roles = [
  ["Borrower", "Applies for financing, executes controlled strategies, bears main trading losses, receives remaining yield"],
  ["Lender", "Provides principal, views risk and yield, receives locked profit and principal protection"],
  ["Vault", "Custodies principal and collateral, restricts trading permissions, records profit pools and liquidation status"],
  ["Admin Risk Control", "Views full risk factors, monitors anomalies, assists strategy and liquidation decisions"]
];

export default function FigmaFlowPage() {
  return (
    <main className="min-h-screen bg-[#0b0d12] px-10 py-10 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#28d7c4]">Solana DeFi Credit Vault</p>
            <h1 className="mt-4 text-5xl font-semibold">Project Business Flow</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
              Solana-based controlled financing protocol: funds enter Vault, borrower can only execute whitelisted strategies.
              System monitors NAV and liquidation line in real-time, recording yield via lender profit lock pool and strategy reinvest pool.
            </p>
          </div>
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5 text-right">
            <p className="text-sm text-slate-500">Core Mechanism</p>
            <p className="mt-2 text-2xl font-semibold text-[#28d7c4]">5% / 95%</p>
            <p className="mt-1 text-sm text-slate-400">Lender Profit Lock / Strategy Reinvest</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-4">
          {roles.map(([role, desc]) => (
            <div key={role} className="rounded-lg border border-[#273244] bg-[#111721] p-5">
              <p className="text-2xl font-semibold text-[#a6e86f]">{role}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <div key={step.title} className="relative min-h-[210px] rounded-lg border border-[#273244] bg-[#111721] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#28d7c4] text-lg font-bold text-[#0b0d12]">
                {index + 1}
              </div>
              <h2 className="mt-5 text-xl font-semibold">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
              {index < steps.length - 1 ? (
                <span className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#28d7c4] bg-[#0b0d12] text-[#28d7c4] lg:flex">
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-3 gap-5">
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5">
            <p className="text-sm uppercase tracking-wide text-slate-500">Profit</p>
            <h3 className="mt-2 text-2xl font-semibold">Profit Settlement</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Daily profit: 5% enters lender profit lock pool, 95% stays in strategy reinvest pool. Yield does not go directly to personal wallets.
            </p>
          </div>
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5">
            <p className="text-sm uppercase tracking-wide text-slate-500">Loss</p>
            <h3 className="mt-2 text-2xl font-semibold">Loss Waterfall</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Loss deducted from strategy reinvest pool first; when insufficient, borrower collateral is deducted. Lender principal and locked profit are always protected.
            </p>
          </div>
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5">
            <p className="text-sm uppercase tracking-wide text-slate-500">Exit</p>
            <h3 className="mt-2 text-2xl font-semibold">Exit Conditions</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              When lender profit lock pool reaches target profit and Vault NAV covers lender principal + locked profit, the protocol can settle and exit.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
