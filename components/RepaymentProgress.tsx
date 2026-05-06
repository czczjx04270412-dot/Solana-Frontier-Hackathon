import type { Loan } from "@/lib/types";

export default function RepaymentProgress({ loan }: { loan: Loan | null }) {
  const amount = loan?.amount ?? 0;
  const repaid = loan?.repaid ?? 0;
  const remaining = Math.max(0, amount - repaid);
  const percent = amount > 0 ? Math.min(100, Math.round((repaid / amount) * 100)) : 0;

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Auto Repayment</p>
          <h2 className="mt-2 text-xl font-semibold">收益自动分配</h2>
        </div>
        <span className="text-2xl font-semibold text-aqua">{percent}%</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">已还金额</p>
          <p className="mt-1 font-semibold text-lime">{repaid.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">剩余贷款</p>
          <p className="mt-1 font-semibold">{remaining.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">分配规则</p>
          <p className="mt-1 text-sm font-semibold">50 / 30 / 20</p>
        </div>
      </div>
    </section>
  );
}
