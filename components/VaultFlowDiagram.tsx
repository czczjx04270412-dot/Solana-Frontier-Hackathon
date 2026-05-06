import type { Loan } from "@/lib/types";

function buildNodes(loan: Loan | null) {
  const amount = loan?.amount ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const ratio = amount > 0 ? Math.round((collateral / amount) * 100) : 0;
  const pnl = loan?.lastPnl ?? 0;

  if (!loan || loan.lastEvent === "none") {
    return [
      { label: "Initial Vault", note: "Loan + collateral enter controlled vault" },
      { label: "Strategy", note: "Click simulation to run 1 day P/L" },
      { label: "Risk Guard", note: "Loss first hits borrower collateral" },
      { label: "Repay Split", note: "Profit splits 50 / 30 / 20" }
    ];
  }

  if (loan.lastEvent === "profit") {
    return [
      { label: `Profit +${pnl.toFixed(2)}U`, note: "Strategy made money today" },
      { label: "Auto Repay 50%", note: `${(pnl * 0.5).toFixed(2)}U goes to loan repayment` },
      { label: "Borrower 30%", note: `${(pnl * 0.3).toFixed(2)}U borrower earnings` },
      { label: "Lender 20%", note: `${(pnl * 0.2).toFixed(2)}U lender yield` }
    ];
  }

  if (loan.lastEvent === "liquidated") {
    return [
      { label: `Loss ${pnl.toFixed(2)}U`, note: "Borrower collateral absorbed the loss" },
      { label: `Collateral ${collateral.toFixed(2)}U`, note: `Collateral ratio fell to ${ratio}%` },
      { label: "Forced Liquidation", note: "Ratio below 120%, strategy stopped" },
      { label: "Lender Protected", note: `${amount.toFixed(2)}U principal protected, no extra yield` }
    ];
  }

  return [
    { label: `Loss ${pnl.toFixed(2)}U`, note: "First loss layer: borrower collateral pays" },
    { label: `Collateral ${collateral.toFixed(2)}U`, note: `Current collateral ratio ${ratio}%` },
    { label: "Lender Principal", note: `${amount.toFixed(2)}U remains protected` },
    { label: "Continue Strategy", note: "Protocol continues while ratio is at least 120%" }
  ];
}

function statusClass(status: Loan["vaultStatus"] | "pending") {
  if (status === "liquidated") return "bg-danger/10 text-danger";
  if (status === "loss") return "bg-amber/10 text-amber";
  return "bg-lime/10 text-lime";
}

export default function VaultFlowDiagram({ loan }: { loan: Loan | null }) {
  const nodes = buildNodes(loan);
  const status = loan?.vaultStatus ?? "pending";

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Vault Flow</p>
          <h2 className="mt-2 text-xl font-semibold">Dynamic profit / loss waterfall</h2>
        </div>
        <span className={`rounded-md px-3 py-2 text-sm ${statusClass(status)}`}>
          {status}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {nodes.map((node, index) => (
          <div key={`${node.label}-${index}`} className="relative rounded-lg border border-line bg-black/20 p-4">
            <p className="font-semibold text-slate-100">{node.label}</p>
            <p className="mt-2 text-sm text-slate-500">{node.note}</p>
            {index < nodes.length - 1 ? (
              <span className="absolute right-3 top-4 hidden text-aqua md:block">→</span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
