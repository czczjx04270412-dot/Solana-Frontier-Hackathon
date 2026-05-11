import Layout from "@/components/Layout";
import LoanCard from "@/components/LoanCard";
import NextStepGuide from "@/components/NextStepGuide";
import { useLoans } from "@/lib/LoanContext";

export default function LendPage() {
  const { loans } = useLoans();

  return (
    <Layout>
      <section className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">贷方视角</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            贷方重点查看本金保护、目标收益、风险等级、AI/ZK 风控解释，以及资金是否进入受控 Vault。
          </p>
        </div>
        <span className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-300">
          {loans.length} 个借款申请
        </span>
      </section>

      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
        <NextStepGuide page="lend" />
      </div>
    </Layout>
  );
}
