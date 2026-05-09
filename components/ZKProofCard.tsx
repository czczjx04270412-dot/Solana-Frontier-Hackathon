const checks = [
  {
    label: "资产来源已验证",
    note: "证明抵押资产来源符合要求，但不暴露完整钱包历史。"
  },
  {
    label: "无严重违约记录",
    note: "证明历史违约检查通过，但不公开每一笔历史借贷记录。"
  },
  {
    label: "收益能力达到阈值",
    note: "收益能力和现金流数据保持隐私，只公开验证结果。"
  },
  {
    label: "策略暴露在限制内",
    note: "不暴露具体仓位，只证明策略风险没有超过协议限制。"
  },
  {
    label: "市场波动模型通过",
    note: "市场模型参数仅后台可见，贷方只看到验证通过。"
  }
];

export default function ZKProofCard() {
  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">ZK RISK PROOF</p>
          <h2 className="mt-2 text-xl font-semibold">隐私因子已验证</h2>
        </div>
        <span className="rounded bg-aqua/10 px-3 py-2 text-sm text-aqua">隐私保护中</span>
      </div>
      <p className="mt-4 rounded-md border border-line bg-ink p-3 text-sm leading-6 text-slate-300">
        抵押率是公开的，因为贷方需要用它定价。ZK 保护的是风险评分背后的隐私数据：资产来源、违约历史、收益能力、策略暴露和市场模型输入。
      </p>
      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div key={check.label} className="rounded-md bg-ink px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-200">{check.label}</span>
              <span className="text-lime">已验证</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{check.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
