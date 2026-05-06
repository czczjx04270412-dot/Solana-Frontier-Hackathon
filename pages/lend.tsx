import Layout from "@/components/Layout";
import LoanCard from "@/components/LoanCard";
import { useLoans } from "@/lib/LoanContext";

export default function LendPage() {
  const { loans } = useLoans();

  return (
    <Layout>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lend</h1>
          <p className="mt-2 text-sm text-slate-400">选择借款列表中的申请放款，资金会先进入 Vault。</p>
        </div>
        <span className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-300">
          {loans.length} loans
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loans.map((loan) => (
          <LoanCard key={loan.id} loan={loan} />
        ))}
      </div>
    </Layout>
  );
}
