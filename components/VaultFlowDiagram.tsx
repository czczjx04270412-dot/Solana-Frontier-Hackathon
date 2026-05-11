import type { Loan } from "@/lib/types";

function buildNodes(loan: Loan | null) {
  const amount = loan?.amount ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const ratio = amount > 0 ? Math.round((collateral / amount) * 100) : 0;
  const pnl = loan?.lastPnl ?? 0;
  const locked = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;

  if (!loan || loan.lastEvent === "none") {
    return [
      { label: "Loan Application", note: "Collateral enters Vault, lender principal enters controlled fund" },
      { label: "Strategy Execution", note: "Borrower can only use whitelisted assets and controlled trading panel" },
      { label: "Profit Split", note: "5% profit locked for lender, 95% stays in strategy reinvest pool" },
      { label: "Risk Protection", note: "Loss deducted from reinvest pool first, then borrower collateral" }
    ];
  }

  if (loan.lastEvent === "repaid") {
    return [
      { label: "Profit Target Reached", note: `Lender has locked ${locked.toFixed(2)}U profit` },
      { label: "Principal Ready to Exit", note: `${amount.toFixed(2)}U principal + locked profit can settle` },
      { label: "Control Released", note: "Lender no longer controls joint vault after exit" },
      { label: "Borrower Withdraws", note: "Remaining collateral and reinvest pool belong to borrower" }
    ];
  }

  if (loan.lastEvent === "withdrawn") {
    return [
      { label: "Protocol Closed", note: "Both parties have completed settlement" },
      { label: "Lender Exit", note: "Lender recovers principal and locked profit" },
      { label: "Vault Unlocked", note: "Joint account no longer bound by lender" },
      { label: "Borrower Withdraws", note: "Borrower can transfer remaining funds to personal wallet" }
    ];
  }

  if (loan.lastEvent === "profit") {
    return [
      { label: `Profit +${pnl.toFixed(2)}U`, note: "Simulated daily yield as % of Vault NAV" },
      { label: "Lender Locks 5%", note: `${(pnl * 0.05).toFixed(2)}U enters lender profit lock pool` },
      { label: "Reinvest 95%", note: `${(pnl * 0.95).toFixed(2)}U stays for borrower to continue trading` },
      { label: "Awaiting Exit Condition", note: "Protocol settles when locked profit reaches target" }
    ];
  }

  if (loan.lastEvent === "liquidated") {
    return [
      { label: `Loss ${pnl.toFixed(2)}U`, note: "Reinvest pool depleted, loss eroding borrower collateral" },
      { label: `Remaining Collateral ${collateral.toFixed(2)}U`, note: `Current ratio dropped to ${ratio}%` },
      { label: "Forced Liquidation", note: "Liquidation line triggered, strategy stopped" },
      { label: "Lender Protected", note: `${amount.toFixed(2)}U principal prioritized` }
    ];
  }

  return [
    { label: `Loss ${pnl.toFixed(2)}U`, note: "Loss deducted from strategy reinvest pool first" },
    { label: `Reinvest Pool ${strategyPool.toFixed(2)}U`, note: "Borrower collateral deducted when pool is insufficient" },
    { label: `Remaining Collateral ${collateral.toFixed(2)}U`, note: `Current ratio ${ratio}%` },
    { label: "Continue Monitoring", note: "Strategy continues while ratio is above liquidation line" }
  ];
}

function statusClass(status: Loan["vaultStatus"] | "pending") {
  if (status === "liquidated") return "bg-danger/10 text-danger";
  if (status === "loss") return "bg-amber/10 text-amber";
  return "bg-lime/10 text-lime";
}

const statusText: Record<Loan["vaultStatus"] | "pending", string> = {
  pending: "Awaiting Funding",
  funded: "Funded",
  strategy: "Strategy Running",
  loss: "Processing Loss",
  liquidated: "Liquidated",
  repaid: "Profit Target Reached",
  withdrawn: "Withdrawn"
};

export default function VaultFlowDiagram({ loan }: { loan: Loan | null }) {
  const nodes = buildNodes(loan);
  const status = loan?.vaultStatus ?? "pending";

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Vault Flow</p>
          <h2 className="mt-2 text-xl font-semibold">Dynamic Yield & Risk Waterfall</h2>
        </div>
        <span className={`rounded-md px-3 py-2 text-sm ${statusClass(status)}`}>
          {statusText[status]}
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
