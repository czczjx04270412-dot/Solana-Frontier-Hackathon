import type { Loan } from "@/lib/types";

export default function BorrowerCostPanel({ loan }: { loan: Loan | null }) {
  const amount = loan?.amount ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const ratio = amount > 0 ? Math.round((collateral / amount) * 100) : 0;
  const liquidationBuffer = Math.max(0, collateral - amount * 1.2);
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const remainingProfit = Math.max(0, targetProfit - lockedProfit);

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">借方视角</p>
      <h2 className="mt-2 text-xl font-semibold">成本和清算风险</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">推荐目标收益</p>
          <p className="mt-1 font-semibold text-amber">{loan?.expectedYield ?? "暂无"}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">贷方目标利润</p>
          <p className="mt-1 font-semibold">{targetProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">已锁定利润</p>
          <p className="mt-1 font-semibold text-aqua">{lockedProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">剩余目标利润</p>
          <p className="mt-1 font-semibold">{remainingProfit.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">当前抵押率</p>
          <p className={ratio < 120 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-lime"}>{ratio}%</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">距离清算缓冲</p>
          <p className="mt-1 font-semibold text-amber">{liquidationBuffer.toFixed(2)} USDC</p>
        </div>
      </div>
      <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        借方重点看目标利润、复投收益和清算风险。盈利时只有 5% 锁给贷方，95% 继续留在策略复投池；
        亏损时复投池先承担，复投池不足才影响借方抵押。
      </p>
    </section>
  );
}
