import type { Loan } from "@/lib/types";

export default function LenderDecisionPanel({ loan }: { loan: Loan }) {
  const worstCase = loan.risk.riskLevel === "high" || loan.risk.riskLevel === "liquidation"
    ? "可能很快清算，贷方本金优先保护，但利息不确定"
    : "本金保护较强，清算概率较低";
  const bestCase = `收回本金 ${loan.amount.toFixed(2)} USDC + 利息 ${loan.interestDue.toFixed(2)} USDC`;

  return (
    <div className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
      <p className="font-semibold text-slate-100">贷方判断</p>
      <p className="mt-2">最好情况：{bestCase}</p>
      <p>最坏情况：{worstCase}</p>
      <p>判断重点：本金保护、能否拿到利息、是否容易清算、资金会被锁多久。</p>
    </div>
  );
}
