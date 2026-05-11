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
          <h1 className="text-2xl font-semibold">Lender View</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Lender focuses on principal protection, target yield, risk level, AI/ZK risk explanations, and whether funds enter the controlled Vault.
          </p>
        </div>
        <span className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-300">
          {loans.length} Loan Applications
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
