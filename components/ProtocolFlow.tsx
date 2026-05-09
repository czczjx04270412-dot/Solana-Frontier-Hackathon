const steps = [
  { title: "借方申请", note: "提交借款金额、抵押金额和钱包地址" },
  { title: "后台准入", note: "AI/ZK 风控通过后才进入贷方市场" },
  { title: "贷方放款", note: "贷方根据风险等级和目标收益决定是否参与" },
  { title: "放款复核", note: "后台确认资金进入受控 Vault" },
  { title: "策略运行", note: "借方只能执行白名单交易，系统实时监控净值" },
  { title: "结算退出", note: "利润达标退出，跌破清算线则停止策略" }
];

export default function ProtocolFlow() {
  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">PROTOCOL FLOW</p>
          <h2 className="mt-2 text-xl font-semibold">融资流程闭环</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          每一步都对应一个页面或后台动作，方便评委快速理解资金为什么不会直接流入借方个人钱包。
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-md border border-line bg-ink p-4">
            <span className="text-xs font-semibold text-aqua">0{index + 1}</span>
            <p className="mt-3 font-semibold text-slate-100">{step.title}</p>
            <p className="mt-2 text-sm leading-5 text-slate-500">{step.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
