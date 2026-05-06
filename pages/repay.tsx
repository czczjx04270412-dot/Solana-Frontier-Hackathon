import Layout from "@/components/Layout";
import RepaymentProgress from "@/components/RepaymentProgress";
import { useLoans } from "@/lib/LoanContext";

export default function RepayPage() {
  const { activeLoan, accrueYield } = useLoans();

  return (
    <Layout>
      <div className="grid gap-6 lg:grid-cols-[0.65fr_1fr]">
        <section className="rounded-lg border border-line bg-panel p-5">
          <h1 className="text-2xl font-semibold">Repay</h1>
          <p className="mt-3 text-sm text-slate-400">
            收益按 50% 自动还贷款、30% 借方收益、20% 贷方收益进行分配。
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
              <span className="text-slate-400">Current Yield</span>
              <span>{activeLoan?.currentYield.toFixed(2) ?? "0.00"} USDC</span>
            </div>
          </div>
          <button
            onClick={() => accrueYield(1)}
            className="mt-5 w-full rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90"
          >
            模拟自动还款
          </button>
        </section>
        <RepaymentProgress loan={activeLoan} />
      </div>
    </Layout>
  );
}
