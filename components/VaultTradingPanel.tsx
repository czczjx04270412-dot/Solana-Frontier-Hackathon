import { useLoans } from "@/lib/LoanContext";
import type { Loan } from "@/lib/types";

type VaultTradingPanelProps = {
  loan: Loan | null;
};

const allowedAssets = ["USDC", "SOL", "mSOL", "JitoSOL"];
const blockedAssets = ["Meme Coins", "Low Liquidity Tokens", "High Risk LP"];

function money(value: number) {
  return `${value.toFixed(2)} USDC`;
}

export default function VaultTradingPanel({ loan }: VaultTradingPanelProps) {
  const { vaultBuySol, vaultSellSol, simulatePriceMove, runRiskCheck } = useLoans();

  if (!loan) return null;

  const liquidationLine = loan.amount * 1.2;
  const safeDistance = loan.vaultNav - liquidationLine;
  const navRatio = (loan.vaultNav / Math.max(loan.amount, 1)) * 100;
  const liquidated = loan.vaultNav < liquidationLine;
  const approvedForMarket = loan.borrowerApprovalStatus === "approved" && loan.lenderApprovalStatus === "approved" && loan.funded;
  const warning = approvedForMarket && !liquidated && navRatio <= 140;
  const statusText = !approvedForMarket ? "Awaiting Admin Approval" : liquidated ? "Liquidation Triggered" : warning ? "Near Liquidation" : "Running Safely";
  const pnlTone = loan.unrealizedPnl >= 0 ? "text-lime" : "text-danger";
  const statusTone = !approvedForMarket ? "text-amber" : liquidated ? "text-danger" : warning ? "text-amber" : "text-aqua";

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-glow">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">VAULT CONTROL</p>
          <h2 className="mt-2 text-2xl font-semibold">Vault Controlled Trading Panel</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Simulates how borrower trades with shared vault funds. Funds stay in the Vault; borrower can only execute whitelisted strategies, not transfer lender funds to personal wallet.
            Trading buttons are enabled only after both loan and funding reviews are approved.
          </p>
        </div>
        <div className={`rounded-md bg-ink px-4 py-3 text-lg font-semibold ${statusTone}`}>
          {statusText}
        </div>
      </div>

      {!approvedForMarket ? (
        <div className="mt-5 rounded-lg border border-amber/30 bg-amber/10 p-4 text-sm leading-6 text-amber">
          This loan has not completed the admin risk review process. Flow: borrower submits application, admin approves loan, lender initiates funding, admin confirms funding into Vault, then borrower can enter market strategy.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-line bg-ink p-4">
          <h3 className="text-lg font-semibold">Allowed Asset Whitelist</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {allowedAssets.map((asset) => (
              <span key={asset} className="rounded-md border border-aqua/40 bg-aqua/10 px-3 py-2 text-sm font-semibold text-aqua">
                {asset}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Whitelist defines which assets the Vault contract can trade. Demo uses SOL as example; real DEX routing can be integrated later.
          </p>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm text-slate-500">Blocked or Requires Manual Review</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {blockedAssets.map((asset) => (
                <span key={asset} className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                  {asset}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Vault USDC Balance" value={loan.vaultUsdc.toFixed(2)} />
          <Metric label="SOL Position" value={loan.vaultSol.toFixed(4)} />
          <Metric label="SOL Simulated Price" value={`${loan.solPrice.toFixed(2)} USDC`} />
          <Metric label="Real-time NAV" value={money(loan.vaultNav)} tone="text-aqua" />
          <Metric label="Unrealized P&L" value={money(loan.unrealizedPnl)} tone={pnlTone} />
          <Metric label="NAV / Loan" value={`${navRatio.toFixed(0)}%`} />
          <Metric label="Liquidation Line" value={money(liquidationLine)} tone="text-amber" />
          <Metric label="Distance to Liquidation" value={money(safeDistance)} tone={safeDistance >= 0 ? "text-lime" : "text-danger"} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <button
          onClick={vaultBuySol}
          disabled={!approvedForMarket || liquidated || loan.vaultUsdc <= 0}
          className="rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua transition hover:bg-aqua/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          Simulate Buy SOL
        </button>
        <button
          onClick={vaultSellSol}
          disabled={!approvedForMarket || liquidated || loan.vaultSol <= 0}
          className="rounded-md border border-lime/60 px-4 py-3 font-semibold text-lime transition hover:bg-lime/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          Simulate Sell SOL
        </button>
        <button
          onClick={simulatePriceMove}
          disabled={!approvedForMarket || liquidated}
          className="rounded-md border border-amber/60 px-4 py-3 font-semibold text-amber transition hover:bg-amber/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          Simulate Price Move
        </button>
        <button
          onClick={runRiskCheck}
          className="rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90"
        >
          Trigger Risk Check
        </button>
      </div>
    </section>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-ink p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
