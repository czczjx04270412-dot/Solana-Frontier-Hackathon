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
              <h1 className="text-2xl font-semibold">收益归属与协议结算</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
                这个页面只看结算：贷方利润锁定了多少、目标利润还差多少、贷方退出能拿多少、
                借方剩余抵押和复投池是多少。实时交易和净值走势放在 Vault 页面。
              </p>
            </div>
            <button
              onClick={resetDemo}
              className="rounded-md border border-danger/60 px-4 py-3 font-semibold text-danger transition hover:bg-danger/10"
            >
              重置 Demo 数据
            </button>
          </div>

          {activeLoan?.vaultStatus === "repaid" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button onClick={continueActiveLoan} className="rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua">
                继续借款
              </button>
              <button onClick={withdrawActiveLoan} className="rounded-md border border-lime/60 px-4 py-3 font-semibold text-lime">
                出金到钱包
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
