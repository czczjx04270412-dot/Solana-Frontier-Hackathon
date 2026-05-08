import type { Loan } from "@/lib/types";

function money(value: number) {
  return `${value.toFixed(2)} USDC`;
}

function tone(value: number) {
  if (value > 0) return "text-lime";
  if (value < 0) return "text-danger";
  return "text-slate-200";
}

export default function ProfitLedgerBoard({ loan }: { loan: Loan | null }) {
  const principal = loan?.amount ?? 0;
  const targetProfit = loan?.interestDue ?? 0;
  const lockedProfit = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const originalCollateral = loan?.collateral ?? 0;
  const vaultNav = loan?.vaultNav ?? principal + originalCollateral;
  const totalPnl = loan?.currentYield ?? 0;
  const latestPnl = loan?.lastPnl ?? 0;
  const history = loan?.pnlHistory ?? [];
  const weeklyPnl = history.slice(-7).reduce((sum, point) => sum + point.pnl, 0);
  const monthlyPnl = history.slice(-30).reduce((sum, point) => sum + point.pnl, 0);
  const remainingTarget = Math.max(0, targetProfit - lockedProfit);
  const lenderExitAmount = principal + lockedProfit;
  const exitReady = lockedProfit >= targetProfit && vaultNav >= lenderExitAmount;
  const collateralLoss = Math.max(0, originalCollateral - collateral);
  const progress = targetProfit > 0 ? Math.min(100, Math.round((lockedProfit / targetProfit) * 100)) : 0;

  return (
    <section className="rounded-lg border border-line bg-panel p-6 shadow-glow">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">PROFIT LEDGER</p>
          <h2 className="mt-2 text-3xl font-semibold">双方收益数据看板</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            这里展示最终权益归属，不展示交易细节。所有收益仍留在 Vault 内部记账：
            贷方利润锁定池不能再参与交易，策略复投池继续由借方使用。
          </p>
        </div>
        <div className={exitReady ? "rounded-md bg-lime/10 px-5 py-3 text-lg font-semibold text-lime" : "rounded-md bg-aqua/10 px-5 py-3 text-lg font-semibold text-aqua"}>
          {exitReady ? "退出条件已满足" : "协议运行中"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-line bg-ink p-5">
          <p className="text-sm text-slate-500">贷方视角</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-slate-400">本金保护线</p>
              <p className="mt-1 text-3xl font-semibold text-amber">{money(principal)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">利润锁定池</p>
              <p className="mt-1 text-3xl font-semibold text-lime">{money(lockedProfit)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">退出时可拿走</p>
              <p className="mt-1 text-2xl font-semibold">{money(lenderExitAmount)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-ink p-5">
          <p className="text-sm text-slate-500">借方视角</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-slate-400">策略复投池</p>
              <p className="mt-1 text-3xl font-semibold text-aqua">{money(strategyPool)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">当前抵押余额</p>
              <p className="mt-1 text-3xl font-semibold text-lime">{money(collateral)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">抵押已承担亏损</p>
              <p className="mt-1 text-2xl font-semibold text-danger">{money(collateralLoss)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-ink p-5">
          <p className="text-sm text-slate-500">Vault 结算视角</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-slate-400">Vault 实时净值</p>
              <p className="mt-1 text-3xl font-semibold text-aqua">{money(vaultNav)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">累计策略盈亏</p>
              <p className={`mt-1 text-3xl font-semibold ${tone(totalPnl)}`}>
                {totalPnl >= 0 ? "+" : ""}{money(totalPnl)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">最新 1 天盈亏</p>
              <p className={`mt-1 text-2xl font-semibold ${tone(latestPnl)}`}>
                {latestPnl >= 0 ? "+" : ""}{money(latestPnl)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-black/20 p-4">
          <p className="text-sm text-slate-500">日收益</p>
          <p className={`mt-2 text-2xl font-semibold ${tone(latestPnl)}`}>
            {latestPnl >= 0 ? "+" : ""}{money(latestPnl)}
          </p>
        </div>
        <div className="rounded-lg bg-black/20 p-4">
          <p className="text-sm text-slate-500">周收益</p>
          <p className={`mt-2 text-2xl font-semibold ${tone(weeklyPnl)}`}>
            {weeklyPnl >= 0 ? "+" : ""}{money(weeklyPnl)}
          </p>
        </div>
        <div className="rounded-lg bg-black/20 p-4">
          <p className="text-sm text-slate-500">月收益</p>
          <p className={`mt-2 text-2xl font-semibold ${tone(monthlyPnl)}`}>
            {monthlyPnl >= 0 ? "+" : ""}{money(monthlyPnl)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-line bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">贷方目标利润进度</p>
            <p className="mt-1 text-xl font-semibold">
              {money(lockedProfit)} / {money(targetProfit)}
            </p>
          </div>
          <div className="text-sm text-slate-400">
            剩余目标利润：<span className="font-semibold text-slate-100">{money(remainingTarget)}</span>
          </div>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-aqua transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          退出条件：贷方利润锁定池达到目标利润，并且 Vault 净值足够覆盖贷方本金 + 已锁定利润。
        </p>
      </div>
    </section>
  );
}
