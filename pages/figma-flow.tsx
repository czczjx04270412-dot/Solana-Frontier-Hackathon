const steps = [
  {
    title: "1. 借方申请融资",
    body: "借方连接钱包，提交借款金额和抵押资产。系统根据抵押率、收益能力、策略风险和市场波动生成风险评分。"
  },
  {
    title: "2. AI / ZK 风控评估",
    body: "贷方可看到风险等级、推荐目标收益和可解释 AI 风险说明；后台风控可查看更完整的隐私风控因子。"
  },
  {
    title: "3. 贷方放款",
    body: "贷方确认风险和目标收益后放款，贷方本金与借方抵押共同进入受控 Vault。"
  },
  {
    title: "4. Vault 受控交易",
    body: "借方不能直接提走资金，只能通过平台的受控交易面板执行白名单策略，例如买入或卖出 SOL。"
  },
  {
    title: "5. 实时净值监控",
    body: "系统持续计算 Vault 实时净值、清算线、距离清算线、日收益、周收益和月收益。"
  },
  {
    title: "6. 盈利分配",
    body: "每日盈利按 5% / 95% 分账：5% 进入贷方利润锁定池，95% 留在策略复投池继续交易。"
  },
  {
    title: "7. 亏损瀑布",
    body: "亏损先扣策略复投池，再扣借方抵押；贷方利润锁定池和贷方本金保护线不参与交易亏损。"
  },
  {
    title: "8. 协议退出",
    body: "当贷方利润锁定池达到目标利润，且 Vault 净值足够覆盖贷方本金与锁定利润时，协议可结算退出。"
  }
];

const roles = [
  ["借方", "申请融资、执行受控策略、承担主要交易亏损、获得剩余收益"],
  ["贷方", "提供本金、查看风险与收益、获得锁定利润和本金保护"],
  ["Vault", "托管本金与抵押、限制交易权限、记录收益池和清算状态"],
  ["后台风控", "查看完整风险因子、监控异常、辅助策略和清算判断"]
];

export default function FigmaFlowPage() {
  return (
    <main className="min-h-screen bg-[#0b0d12] px-10 py-10 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#28d7c4]">Solana DeFi Credit Vault</p>
            <h1 className="mt-4 text-5xl font-semibold">项目业务流程图</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
              基于 Solana 的受控融资协议：资金进入 Vault，借方只能执行白名单策略；
              系统实时监控净值和清算线，并通过贷方利润锁定池和策略复投池完成收益记账。
            </p>
          </div>
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5 text-right">
            <p className="text-sm text-slate-500">核心机制</p>
            <p className="mt-2 text-2xl font-semibold text-[#28d7c4]">5% / 95%</p>
            <p className="mt-1 text-sm text-slate-400">贷方利润锁定 / 策略复投</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-4">
          {roles.map(([role, desc]) => (
            <div key={role} className="rounded-lg border border-[#273244] bg-[#111721] p-5">
              <p className="text-2xl font-semibold text-[#a6e86f]">{role}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <div key={step.title} className="relative min-h-[210px] rounded-lg border border-[#273244] bg-[#111721] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#28d7c4] text-lg font-bold text-[#0b0d12]">
                {index + 1}
              </div>
              <h2 className="mt-5 text-xl font-semibold">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
              {index < steps.length - 1 ? (
                <span className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#28d7c4] bg-[#0b0d12] text-[#28d7c4] lg:flex">
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-3 gap-5">
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5">
            <p className="text-sm uppercase tracking-wide text-slate-500">Profit</p>
            <h3 className="mt-2 text-2xl font-semibold">盈利结算</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              每日盈利按 5% 进入贷方利润锁定池，95% 留在策略复投池。收益不直接进入个人钱包。
            </p>
          </div>
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5">
            <p className="text-sm uppercase tracking-wide text-slate-500">Loss</p>
            <h3 className="mt-2 text-2xl font-semibold">亏损瀑布</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              亏损优先扣策略复投池，复投池不足时再扣借方抵押，贷方本金和已锁定利润优先保护。
            </p>
          </div>
          <div className="rounded-lg border border-[#273244] bg-[#111721] p-5">
            <p className="text-sm uppercase tracking-wide text-slate-500">Exit</p>
            <h3 className="mt-2 text-2xl font-semibold">退出条件</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              贷方利润锁定池达到目标利润，且 Vault 净值足够覆盖贷方本金和锁定利润，协议可结算退出。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
