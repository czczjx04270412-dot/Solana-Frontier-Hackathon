const steps = [
  { title: "Loan Application", note: "Borrower inputs loan amount and collateral" },
  { title: "AI Risk Engine", note: "Backend rules score, AI explains the result" },
  { title: "ZK Verification", note: "Proves private factors passed without exposing raw data" },
  { title: "Lender Funding", note: "Lender decides whether to fund based on risk and yield" },
  { title: "Enter Vault", note: "Funds are controlled, cannot go directly to borrower wallet" },
  { title: "Settlement or Liquidation", note: "Exit on profit target, liquidate on high risk" }
];

export default function ProtocolFlow() {
  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Protocol Flow</p>
      <h2 className="mt-2 text-xl font-semibold">Financing Lifecycle</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-lg border border-line bg-black/20 p-4">
            <span className="text-xs text-aqua">Step {index + 1}</span>
            <p className="mt-2 font-semibold text-slate-100">{step.title}</p>
            <p className="mt-2 text-sm leading-5 text-slate-500">{step.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
