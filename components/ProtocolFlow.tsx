const steps = [
  { title: "借款申请", note: "借方输入借款金额和抵押金额" },
  { title: "AI 风控", note: "后端规则算分，AI 负责解释" },
  { title: "ZK 验证", note: "证明隐私因子通过，不暴露原始数据" },
  { title: "贷方放款", note: "贷方根据风险和利率决定是否放款" },
  { title: "进入资金库", note: "资金受控使用，不能直接进借方钱包" },
  { title: "结算或清算", note: "利润达标退出，风险过高触发清算" }
];

export default function ProtocolFlow() {
  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">协议流程</p>
      <h2 className="mt-2 text-xl font-semibold">融资闭环</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-lg border border-line bg-black/20 p-4">
            <span className="text-xs text-aqua">步骤 {index + 1}</span>
            <p className="mt-2 font-semibold text-slate-100">{step.title}</p>
            <p className="mt-2 text-sm leading-5 text-slate-500">{step.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
