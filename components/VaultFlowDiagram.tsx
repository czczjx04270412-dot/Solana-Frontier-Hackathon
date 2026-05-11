import type { Loan } from "@/lib/types";

function buildNodes(loan: Loan | null) {
  const amount = loan?.amount ?? 0;
  const collateral = loan?.currentCollateral ?? loan?.collateral ?? 0;
  const ratio = amount > 0 ? Math.round((collateral / amount) * 100) : 0;
  const pnl = loan?.lastPnl ?? 0;
  const locked = loan?.lenderProfitLocked ?? loan?.repaid ?? 0;
  const strategyPool = loan?.strategyReinvestPool ?? loan?.borrowerEarnings ?? 0;

  if (!loan || loan.lastEvent === "none") {
    return [
      { label: "借方申请", note: "抵押进入 Vault，贷方本金进入受控资金库" },
      { label: "策略执行", note: "借方只能使用白名单资产和受控交易面板" },
      { label: "利润分账", note: "盈利 5% 锁给贷方，95% 留在策略复投池" },
      { label: "风险保护", note: "亏损先扣复投池，再扣借方抵押" }
    ];
  }

  if (loan.lastEvent === "repaid") {
    return [
      { label: "目标利润达标", note: `贷方已锁定 ${locked.toFixed(2)}U 利润` },
      { label: "本金可退出", note: `${amount.toFixed(2)}U 本金和锁定利润可结算` },
      { label: "控制权释放", note: "贷方退出后不再控制共同资金库" },
      { label: "借方出金", note: "剩余抵押和复投池归借方处理" }
    ];
  }

  if (loan.lastEvent === "withdrawn") {
    return [
      { label: "协议关闭", note: "双方已完成结算" },
      { label: "贷方退出", note: "贷方拿回本金和锁定利润" },
      { label: "Vault 解锁", note: "共同账户不再受贷方约束" },
      { label: "借方出金", note: "借方可以把剩余资金转回个人钱包" }
    ];
  }

  if (loan.lastEvent === "profit") {
    return [
      { label: `盈利 +${pnl.toFixed(2)}U`, note: "按 Vault 净值百分比模拟当日收益" },
      { label: "贷方锁定 5%", note: `${(pnl * 0.05).toFixed(2)}U 进入贷方利润锁定池` },
      { label: "策略复投 95%", note: `${(pnl * 0.95).toFixed(2)}U 留给借方继续交易` },
      { label: "等待退出条件", note: "锁定利润达到目标后协议可结算" }
    ];
  }

  if (loan.lastEvent === "liquidated") {
    return [
      { label: `亏损 ${pnl.toFixed(2)}U`, note: "复投池不足，亏损继续侵蚀借方抵押" },
      { label: `剩余抵押 ${collateral.toFixed(2)}U`, note: `当前抵押率降到 ${ratio}%` },
      { label: "强制清算", note: "触发清算线，策略停止" },
      { label: "贷方保护", note: `${amount.toFixed(2)}U 本金优先保护` }
    ];
  }

  return [
    { label: `亏损 ${pnl.toFixed(2)}U`, note: "亏损先扣策略复投池" },
    { label: `复投池 ${strategyPool.toFixed(2)}U`, note: "复投池不够时再扣借方抵押" },
    { label: `剩余抵押 ${collateral.toFixed(2)}U`, note: `当前抵押率 ${ratio}%` },
    { label: "继续监控", note: "抵押率不低于清算线时策略继续运行" }
  ];
}

function statusClass(status: Loan["vaultStatus"] | "pending") {
  if (status === "liquidated") return "bg-danger/10 text-danger";
  if (status === "loss") return "bg-amber/10 text-amber";
  return "bg-lime/10 text-lime";
}

const statusText: Record<Loan["vaultStatus"] | "pending", string> = {
  pending: "等待放款",
  funded: "已放款",
  strategy: "策略运行中",
  loss: "亏损处理中",
  liquidated: "已清算",
  repaid: "利润达标",
  withdrawn: "已出金"
};

export default function VaultFlowDiagram({ loan }: { loan: Loan | null }) {
  const nodes = buildNodes(loan);
  const status = loan?.vaultStatus ?? "pending";

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">资金库流程</p>
          <h2 className="mt-2 text-xl font-semibold">动态收益与风险瀑布</h2>
        </div>
        <span className={`rounded-md px-3 py-2 text-sm ${statusClass(status)}`}>
          {statusText[status]}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {nodes.map((node, index) => (
          <div key={`${node.label}-${index}`} className="relative rounded-lg border border-line bg-black/20 p-4">
            <p className="font-semibold text-slate-100">{node.label}</p>
            <p className="mt-2 text-sm text-slate-500">{node.note}</p>
            {index < nodes.length - 1 ? (
              <span className="absolute right-3 top-4 hidden text-aqua md:block">→</span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
