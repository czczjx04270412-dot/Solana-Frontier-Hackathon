import type { Loan } from "@/lib/types";

export default function RepaymentProgress({ loan }: { loan: Loan | null }) {
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const remainingProfit = Math.max(0, targetProfit - lockedProfit);
  const percent = targetProfit > 0 ? Math.min(100, Math.round((lockedProfit / targetProfit) * 100)) : 0;
  const ratio = loan?.amount ? Math.round((collateral / loan.amount) * 100) : 0;
  const pnl = loan?.lastPnl ?? 0;
  const isLoss = pnl < 0;
  const isLiquidated = loan?.vaultStatus === "liquidated";
  const isRepaid = loan?.vaultStatus === "repaid" || loan?.vaultStatus === "withdrawn";

  const title = isRepaid ? "目标利润已达标" : isLiquidated ? "强制清算" : isLoss ? "亏损先扣复投池" : "盈利按 5 / 95 分配";

  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">LENDER PROFIT LOCK</p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>
        <span className="text-2xl font-semibold text-aqua">{percent}%</span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Item label="贷方利润锁定池" value={`${lockedProfit.toFixed(2)} USDC`} tone="text-lime" />
        <Item label="剩余目标利润" value={`${remainingProfit.toFixed(2)} USDC`} />
        <Item label="当前抵押率" value={`${ratio}%`} tone={ratio < 120 ? "text-danger" : "text-amber"} />
      </div>
      <div className="mt-3 rounded-md bg-ink p-3 text-sm leading-6 text-slate-300">
        {isRepaid
          ? "贷方目标利润已锁定。结算时贷方拿回本金和锁定利润，借方获得剩余抵押与策略复投池。"
          : pnl >= 0
            ? `最新盈利：+${pnl.toFixed(2)}U。其中 5% 锁入贷方利润池，95% 留在策略复投池继续交易。当前复投池：${strategyPool.toFixed(2)} USDC。`
            : `最新亏损：${pnl.toFixed(2)}U。亏损先扣策略复投池，不足部分再扣借方抵押；贷方利润锁定池和本金保护线不参与交易亏损。`}
        {isLiquidated ? " 当前已触发清算线，策略停止并优先保护贷方本金。" : ""}
      </div>
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
