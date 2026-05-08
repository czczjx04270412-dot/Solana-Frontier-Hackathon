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
  const approvedForMarket = loan.borrowerApprovalStatus === "approved" && loan.lenderApprovalStatus === "approved" && loan.funded;
  const warning = approvedForMarket && !liquidated && navRatio <= 140;
  const statusText = !approvedForMarket ? "等待后台确认" : liquidated ? "已触发清算" : warning ? "接近清算线" : "安全运行中";
  const pnlTone = loan.unrealizedPnl >= 0 ? "text-lime" : "text-danger";
  const statusTone = !approvedForMarket ? "text-amber" : liquidated ? "text-danger" : warning ? "text-amber" : "text-aqua";

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-glow">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">VAULT CONTROL</p>
          <h2 className="mt-2 text-2xl font-semibold">Vault 受控交易面板</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            这里模拟借方如何使用共同账户交易：资金留在 Vault 内，借方只能执行白名单策略，不能直接把贷方资金转到个人钱包。
            借款审核和放款审核都通过后，交易按钮才会开放。
          </p>
        </div>
        <div className={`rounded-md bg-ink px-4 py-3 text-lg font-semibold ${statusTone}`}>
          {statusText}
        </div>
      </div>

      {!approvedForMarket ? (
        <div className="mt-5 rounded-lg border border-amber/30 bg-amber/10 p-4 text-sm leading-6 text-amber">
          当前贷款还没有完成后台风控闭环。流程是：借方提交申请、后台通过借款准入、贷方发起放款、后台确认放款入 Vault，最后借方才可以进入市场策略。
        </div>
      ) : null}

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
            <p className="text-sm text-slate-500">禁止或需要人工审核</p>
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
          <Metric label="Vault USDC 余额" value={loan.vaultUsdc.toFixed(2)} />
          <Metric label="SOL 持仓" value={loan.vaultSol.toFixed(4)} />
          <Metric label="SOL 模拟价格" value={`${loan.solPrice.toFixed(2)} USDC`} />
          <Metric label="实时净值" value={money(loan.vaultNav)} tone="text-aqua" />
          <Metric label="未实现盈亏" value={money(loan.unrealizedPnl)} tone={pnlTone} />
          <Metric label="净值 / 贷款" value={`${navRatio.toFixed(0)}%`} />
          <Metric label="清算线" value={money(liquidationLine)} tone="text-amber" />
          <Metric label="距离清算线" value={money(safeDistance)} tone={safeDistance >= 0 ? "text-lime" : "text-danger"} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <button
          onClick={vaultBuySol}
          disabled={!approvedForMarket || liquidated || loan.vaultUsdc <= 0}
          className="rounded-md border border-aqua/60 px-4 py-3 font-semibold text-aqua transition hover:bg-aqua/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          模拟买入 SOL
        </button>
        <button
          onClick={vaultSellSol}
          disabled={!approvedForMarket || liquidated || loan.vaultSol <= 0}
          className="rounded-md border border-lime/60 px-4 py-3 font-semibold text-lime transition hover:bg-lime/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
        >
          模拟卖出 SOL
        </button>
        <button
          onClick={simulatePriceMove}
          disabled={!approvedForMarket || liquidated}
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

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-ink p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
