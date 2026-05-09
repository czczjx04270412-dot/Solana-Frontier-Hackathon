import BorrowForm from "@/components/BorrowForm";
import BorrowerCostPanel from "@/components/BorrowerCostPanel";
import Layout from "@/components/Layout";
import NextStepGuide from "@/components/NextStepGuide";
import RepaymentProgress from "@/components/RepaymentProgress";
import { useLoans } from "@/lib/LoanContext";

export default function BorrowPage() {
  const { activeLoan } = useLoans();

  return (
    <Layout>
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wide text-aqua">BORROWER WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-semibold">借方视角</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
          借方关注融资成本、目标利润、清算安全距离和策略复投池。借方不能直接提走 Vault 资金，只能在受控策略内交易。
        </p>
      </section>
      <div className="space-y-6">
        <BorrowerCostPanel loan={activeLoan} />
        <RepaymentProgress loan={activeLoan} />
        <BorrowForm />
        <NextStepGuide page="borrow" />
      </div>
    </Layout>
  );
}
