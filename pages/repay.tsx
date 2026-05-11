import Layout from "@/components/Layout";
import LoanEconomicsPanel from "@/components/LoanEconomicsPanel";
import NextStepGuide from "@/components/NextStepGuide";
import ProfitLedgerBoard from "@/components/ProfitLedgerBoard";
import RepaymentProgress from "@/components/RepaymentProgress";
import SettlementSummary from "@/components/SettlementSummary";
import { useLoans } from "@/lib/LoanContext";

export default function RepayPage() {
  const { activeLoan, continueActiveLoan, withdrawActiveLoan, resetDemo } = useLoans();

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-lg border border-line bg-panel p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Profit Attribution & Settlement</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
                This page focuses on settlement: how much lender profit is locked, how much remains to reach target, lender exit amount,
                and borrower remaining collateral and reinvest pool. Live trading and NAV trends are on the Vault page.
              </p>
            </div>
            <button
              onClick={resetDemo}
              className="rounded-md border border-danger/60 px-4 py-3 font-semibold text-danger transition hover:bg-danger/10"
            >
              Reset Demo Data
            </button>
          </div>

          {activeLoan?.vaultStatus === "repaid" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button onClick={continueActiveLoan} className="rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua">
                Continue Loan
              </button>
              <button onClick={withdrawActiveLoan} className="rounded-md border border-lime/60 px-4 py-3 font-semibold text-lime">
                Withdraw to Wallet
              </button>
            </div>
          ) : null}
        </section>

        <ProfitLedgerBoard loan={activeLoan} />

        <section className="grid gap-6 xl:grid-cols-2">
          <SettlementSummary loan={activeLoan} />
          <RepaymentProgress loan={activeLoan} />
        </section>

        <LoanEconomicsPanel loan={activeLoan} />
        <NextStepGuide page="repay" />
      </div>
    </Layout>
  );
}
