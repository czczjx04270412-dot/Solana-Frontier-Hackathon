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
    <section className="rounded-md border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">BORROWER COST</p>
      <h2 className="mt-2 text-xl font-semibold">成本和清算风险</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Item label="推荐目标收益" value={loan?.expectedYield ?? "暂无"} tone="text-amber" />
        <Item label="贷方目标利润" value={`${targetProfit.toFixed(2)} USDC`} />
        <Item label="已锁定利润" value={`${lockedProfit.toFixed(2)} USDC`} tone="text-aqua" />
        <Item label="剩余目标利润" value={`${remainingProfit.toFixed(2)} USDC`} />
        <Item label="当前抵押率" value={`${ratio}%`} tone={ratio < 120 ? "text-danger" : "text-lime"} />
        <Item label="距离清算缓冲" value={`${liquidationBuffer.toFixed(2)} USDC`} tone="text-amber" />
      </div>
      <p className="mt-4 rounded-md border border-line bg-ink p-3 text-sm leading-6 text-slate-300">
        借方重点看目标利润、复投收益和清算风险。盈利时只有 5% 锁给贷方，95% 继续留在策略复投池；亏损时复投池先承担，不足部分才影响借方抵押。
      </p>
    </section>
  );
}

function Item({ label, value, tone = "text-slate-100" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-ink p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
