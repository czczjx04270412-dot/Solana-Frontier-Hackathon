import Layout from "@/components/Layout";
import RepaymentProgress from "@/components/RepaymentProgress";
import { useLoans } from "@/lib/LoanContext";

export default function RepayPage() {
  const { activeLoan, accrueYield, continueActiveLoan, withdrawActiveLoan } = useLoans();
  const isClosed = activeLoan?.vaultStatus === "liquidated" || activeLoan?.vaultStatus === "repaid" || activeLoan?.vaultStatus === "withdrawn";

  return (
    <Layout>
      <div className="grid gap-6 lg:grid-cols-[0.65fr_1fr]">
        <section className="rounded-lg border border-line bg-panel p-5">
          <h1 className="text-2xl font-semibold">Repay</h1>
          <p className="mt-3 text-sm text-slate-400">
            Profit distribution: 50% automatic principal + interest repayment, 30%
            borrower earnings, 20% lender yield. After full repayment, lender control
            is released.
          </p>
          <div className="mt-5 space-y-3 rounded-lg bg-black/20 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Borrower Earnings</span>
              <span>{activeLoan?.borrowerEarnings.toFixed(2) ?? "0.00"} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Lender Earnings</span>
              <span>{activeLoan?.lenderEarnings.toFixed(2) ?? "0.00"} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Repayment Target</span>
              <span>{activeLoan?.repaymentTarget.toFixed(2) ?? "0.00"} USDC</span>
            </div>
          </div>
          <button
            onClick={() => accrueYield(1)}
            disabled={isClosed}
            className="mt-5 w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {isClosed ? "Protocol Closed" : "Simulate Auto Repayment"}
          </button>
          {activeLoan?.vaultStatus === "repaid" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button onClick={continueActiveLoan} className="rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua">
                Continue Borrowing
              </button>
              <button onClick={withdrawActiveLoan} className="rounded-md border border-lime/60 px-4 py-3 font-semibold text-lime">
                Withdraw to Wallet
              </button>
            </div>
          ) : null}
        </section>
        <RepaymentProgress loan={activeLoan} />
      </div>
    </Layout>
  );
}
