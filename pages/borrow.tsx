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
        <h1 className="text-2xl font-semibold">Borrower View</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Borrower focuses on financing cost, target profit, liquidation buffer, and strategy reinvest pool. Borrower cannot withdraw Vault funds directly, only trade within controlled strategies.
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
