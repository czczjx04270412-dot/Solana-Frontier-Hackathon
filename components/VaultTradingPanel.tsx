import { useLoans } from "@/lib/LoanContext";
import type { Loan } from "@/lib/types";

type VaultTradingPanelProps = {
  loan: Loan | null;
};

const allowedAssets = ["USDC", "SOL", "mSOL", "JitoSOL"];
const blockedAssets = ["Meme 币", "低流动性代币", "高风险 LP"];

function money(value: number) {
  return `${value.toFixed(2)} USDC`;
}

export default function VaultTradingPanel({ loan }: VaultTradingPanelProps) {
  const { vaultBuySol, vaultSellSol, simulatePriceMove, runRiskCheck } = useLoans();

  if (!loan) return null;

  const liquidationLine = loan.amount * 1.2;
  const safeDistance = loan.vaultNav - liquidationLine;
  const navRatio = (loan.vaultNav / Math.max(loan.amount, 1)) * 100;
  const liquidated = loan.vaultNav < liquidationLine;
  const warning = !liquidated && navRatio <= 140;
  const statusText = liquidated ? "已触发清算" : warning ? "接近清算线" : "安全运行中";
  const pnlTone = loan.unrealizedPnl >= 0 ? "text-lime" : "text-danger";
  const statusTone = liquidated ? "text-danger" : warning ? "text-amber" : "text-aqua";

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-glow">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">VAULT CONTROL</p>
          <h2 className="mt-2 text-2xl font-semibold">Vault 受控交易面板</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            这里模拟借方如何使用共同账户交易：资金留在 Vault 内，借方只能执行白名单策略，不能直接把贷方资金转到个人钱包。
            每次买卖或价格波动后，系统都会重新计算实时净值和清算线。
          </p>
        </div>
        <div className={`rounded-md bg-ink px-4 py-3 text-lg font-semibold ${statusTone}`}>
          {statusText}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-line bg-ink p-4">
          <h3 className="text-lg font-semibold">允许资产白名单</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {allowedAssets.map((asset) => (
              <span key={asset} className="rounded-md border border-aqua/40 bg-aqua/10 px-3 py-2 text-sm font-semibold text-aqua">
                {asset}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            白名单代表合约允许 Vault 交易的资产范围。Demo 里先用 SOL 做示范，后端或合约以后可以接入真实 DEX 路由。
          </p>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm text-slate-500">禁止或需要人工审批</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {blockedAssets.map((asset) => (
                <span key={asset} className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                  {asset}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">Vault USDC 余额</p>
            <p className="mt-2 text-xl font-semibold">{loan.vaultUsdc.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">SOL 持仓</p>
            <p className="mt-2 text-xl font-semibold">{loan.vaultSol.toFixed(4)}</p>
          </div>
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">SOL 模拟价格</p>
            <p className="mt-2 text-xl font-semibold">{loan.solPrice.toFixed(2)} USDC</p>
          </div>
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">实时净值</p>
            <p className="mt-2 text-xl font-semibold text-aqua">{money(loan.vaultNav)}</p>
          </div>
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">未实现盈亏</p>
            <p className={`mt-2 text-xl font-semibold ${pnlTone}`}>{money(loan.unrealizedPnl)}</p>
          </div>
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">净值 / 贷款</p>
            <p className="mt-2 text-xl font-semibold">{navRatio.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">清算线</p>
            <p className="mt-2 text-xl font-semibold text-amber">{money(liquidationLine)}</p>
          </div>
          <div className="rounded-lg bg-ink p-4">
            <p className="text-sm text-slate-500">距离清算线</p>
            <p className={`mt-2 text-xl font-semibold ${safeDistance >= 0 ? "text-lime" : "text-danger"}`}>
              {money(safeDistance)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <button
          onClick={vaultBuySol}
          disabled={liquidated || loan.vaultUsdc <= 0}
          className="rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua transition hover:bg-aqua/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          模拟买入 SOL
        </button>
        <button
          onClick={vaultSellSol}
          disabled={liquidated || loan.vaultSol <= 0}
          className="rounded-md border border-lime/60 px-4 py-3 font-semibold text-lime transition hover:bg-lime/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          模拟卖出 SOL
        </button>
        <button
          onClick={simulatePriceMove}
          disabled={liquidated}
          className="rounded-md border border-amber/60 px-4 py-3 font-semibold text-amber transition hover:bg-amber/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          模拟价格波动
        </button>
        <button
          onClick={runRiskCheck}
          className="rounded-md bg-aqua px-4 py-3 font-semibold text-ink transition hover:bg-aqua/90"
        >
          触发风控检查
        </button>
      </div>
    </section>
  );
}
