import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import VaultFlowDiagram from "@/components/VaultFlowDiagram";
import YieldChart from "@/components/YieldChart";
import { useLoans } from "@/lib/LoanContext";

export default function VaultPage() {
  const { activeLoan, accrueYield } = useLoans();
  const collateral = activeLoan?.currentCollateral ?? activeLoan?.collateral ?? 0;

  return (
    <Layout>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Protected Lender Principal" value={`${activeLoan?.amount ?? 0} USDC`} />
        <MetricCard label="Borrower Collateral" value={`${collateral.toFixed(2)} USDC`} tone="lime" />
        <MetricCard label="Net Strategy P/L" value={`${activeLoan?.currentYield.toFixed(2) ?? "0.00"} USDC`} tone="amber" />
      </div>
      <div className="mt-6 space-y-6">
        <VaultFlowDiagram loan={activeLoan} />
        <section className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <div className="rounded-lg border border-line bg-panel p-5">
            <h1 className="text-2xl font-semibold">Programmable Vault</h1>
            <p className="mt-3 text-sm text-slate-400">
              Funds cannot go directly to the borrower wallet. Profit is split by
              the repayment rule. Loss is absorbed by borrower collateral first,
              and the strategy stops once collateral ratio falls below 120%.
            </p>
            <button
              onClick={() => accrueYield(1)}
              disabled={activeLoan?.vaultStatus === "liquidated"}
              className="mt-5 w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {activeLoan?.vaultStatus === "liquidated" ? "Liquidated" : "Run 1 Day Strategy P/L"}
            </button>
          </div>
          <YieldChart loan={activeLoan} />
        </section>
      </div>
    </Layout>
  );
}
