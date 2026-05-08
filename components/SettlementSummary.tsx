import type { Loan } from "@/lib/types";

function statusLabel(loan: Loan | null) {
  if (!loan) return "暂无贷款";
  if (loan.vaultStatus === "repaid") return "利润达标，协议可结算";
  if (loan.vaultStatus === "withdrawn") return "已关闭，双方可出金";
  if (loan.vaultStatus === "liquidated") return "已清算，策略停止";
  if (loan.vaultStatus === "loss") return "亏损处理中，先扣复投池和抵押";
  return "运行中，策略执行中";
}

export default function SettlementSummary({ loan }: { loan: Loan | null }) {
  const principal = loan?.amount ?? 0;
  const targetProfit = loan?.interestDue ?? 0;
  const lenderProfitLocked = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyReinvestPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const originalCollateral = loan?.collateral ?? 0;
  const lossAbsorbed = Math.max(0, originalCollateral - collateral);
  const latestPnl = loan?.lastPnl ?? 0;
  const totalPnl = loan?.currentYield ?? 0;
  const vaultNav = loan?.vaultNav ?? principal + collateral + lenderProfitLocked + strategyReinvestPool;
  const remainingProfit = Math.max(0, targetProfit - lenderProfitLocked);
  const exitReady = lenderProfitLocked >= targetProfit && vaultNav >= principal + lenderProfitLocked;

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">结算摘要</p>
          <h2 className="mt-2 text-xl font-semibold">最终盈亏情况</h2>
        </div>
        <span className="rounded-md bg-aqua/10 px-3 py-2 text-sm text-aqua">
          {statusLabel(loan)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">最新盈亏</p>
          <p className={latestPnl < 0 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-lime"}>
            {latestPnl >= 0 ? "+" : ""}{latestPnl.toFixed(2)} USDC
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">累计策略盈亏</p>
          <p className={totalPnl < 0 ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-lime"}>
            {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} USDC
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">贷方利润锁定池</p>
          <p className="mt-1 font-semibold text-lime">{lenderProfitLocked.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">还差目标利润</p>
          <p className="mt-1 font-semibold">{remainingProfit.toFixed(2)} USDC</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">贷方本金保护线</p>
          <p className="mt-1 font-semibold text-amber">{principal.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">策略复投池</p>
          <p className="mt-1 font-semibold text-aqua">{strategyReinvestPool.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Vault 实时净值</p>
          <p className="mt-1 font-semibold">{vaultNav.toFixed(2)} USDC</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">抵押承担亏损</p>
          <p className="mt-1 font-semibold text-danger">{lossAbsorbed.toFixed(2)} USDC</p>
        </div>
      </div>

      <p className="mt-4 rounded-md border border-line bg-black/20 p-3 text-sm leading-6 text-slate-300">
        盈利时，5% 进入贷方利润锁定池，95% 进入策略复投池。贷方利润锁定池不能再被借方拿去交易；
        亏损时先扣策略复投池，再扣借方抵押，不扣贷方利润锁定池，也不扣贷方本金保护线。
        {exitReady ? " 当前已满足退出条件：贷方目标利润已锁定，Vault 净值足够覆盖本金和锁定利润。" : ""}
      </p>
    </section>
  );
}
