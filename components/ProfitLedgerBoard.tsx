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
    <section className="rounded-md border border-line bg-panel p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">PROFIT LEDGER</p>
          <h2 className="mt-2 text-3xl font-semibold">双方收益数据看板</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            这里展示最终权益归属。所有收益仍在 Vault 内部记账，贷方利润锁定池不再参与交易，策略复投池继续由借方使用。
          </p>
        </div>
        <div className={exitReady ? "rounded bg-lime/10 px-5 py-3 text-lg font-semibold text-lime" : "rounded bg-aqua/10 px-5 py-3 text-lg font-semibold text-aqua"}>
          {exitReady ? "退出条件已满足" : "协议运行中"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <LedgerColumn
          title="贷方视角"
          items={[
            ["本金保护线", money(principal), "text-amber"],
            ["利润锁定池", money(lockedProfit), "text-lime"],
            ["退出时可拿走", money(lenderExitAmount), "text-slate-100"]
          ]}
        />
        <LedgerColumn
          title="借方视角"
          items={[
            ["策略复投池", money(strategyPool), "text-aqua"],
            ["当前抵押余额", money(collateral), "text-lime"],
            ["抵押已承担亏损", money(collateralLoss), "text-danger"]
          ]}
        />
        <LedgerColumn
          title="Vault 结算视角"
          items={[
            ["Vault 实时净值", money(vaultNav), "text-aqua"],
            ["累计策略盈亏", `${totalPnl >= 0 ? "+" : ""}${money(totalPnl)}`, tone(totalPnl)],
            ["最新 1 天盈亏", `${latestPnl >= 0 ? "+" : ""}${money(latestPnl)}`, tone(latestPnl)]
          ]}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <SmallMetric label="日收益" value={`${latestPnl >= 0 ? "+" : ""}${money(latestPnl)}`} tone={tone(latestPnl)} />
        <SmallMetric label="周收益" value={`${weeklyPnl >= 0 ? "+" : ""}${money(weeklyPnl)}`} tone={tone(weeklyPnl)} />
        <SmallMetric label="月收益" value={`${monthlyPnl >= 0 ? "+" : ""}${money(monthlyPnl)}`} tone={tone(monthlyPnl)} />
      </div>

      <div className="mt-5 rounded-md border border-line bg-ink p-4">
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
          退出条件：贷方利润锁定池达到目标利润，并且 Vault 净值足够覆盖贷方本金和已锁定利润。
        </p>
      </div>
    </section>
  );
}

function LedgerColumn({ title, items }: { title: string; items: Array<[string, string, string]> }) {
  return (
    <div className="rounded-md border border-line bg-ink p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <div className="mt-5 space-y-4">
        {items.map(([label, value, className]) => (
          <div key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${className}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallMetric({ label, value, tone: className }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md bg-ink p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${className}`}>{value}</p>
    </div>
  );
}
