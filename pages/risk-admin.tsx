import CurrentLoanSummary from "@/components/CurrentLoanSummary";
import Layout from "@/components/Layout";
import RiskFactorPanel from "@/components/RiskFactorPanel";
import ZKProofCard from "@/components/ZKProofCard";
import CollateralRiskTable from "@/components/CollateralRiskTable";
import { useLoans } from "@/lib/LoanContext";

export default function RiskAdminPage() {
  const { activeLoan } = useLoans();

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="text-2xl font-semibold">后台风控视角</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          这个页面模拟协议后台人员看到的内容：完整风控因子、ZK 验证项、风险规则和当前贷款状态。普通贷方不应该看到这些原始明细。
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <CurrentLoanSummary loan={activeLoan} />
          <ZKProofCard />
          <CollateralRiskTable />
        </div>
        <RiskFactorPanel risk={activeLoan?.risk ?? null} />
      </div>
    </Layout>
  );
}
