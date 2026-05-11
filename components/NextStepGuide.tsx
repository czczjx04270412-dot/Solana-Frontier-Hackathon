import Link from "next/link";

const guides: Record<string, { title: string; body: string; href: string; action: string }> = {
  dashboard: { title: "下一步", body: "从总览进入借方申请，开始完整融资流程。", href: "/borrow", action: "去借款页面" },
  borrow: { title: "下一步", body: "借方申请完成后，切到贷方视角查看风险和目标收益。", href: "/lend", action: "去放款页面" },
  lend: { title: "下一步", body: "贷方确认放款后，进入 Vault 查看资金如何受控交易。", href: "/vault", action: "去 Vault 页面" },
  vault: { title: "下一步", body: "策略运行后，到结算页查看双方收益归属和退出条件。", href: "/repay", action: "去结算页面" },
  repay: { title: "下一步", body: "结算完成后，后台风控可以复核完整风险因子。", href: "/risk-admin", action: "去后台风控" },
  "risk-admin": { title: "演示闭环", body: "后台风控用于解释风险因子，回到总览可重新演示。", href: "/dashboard", action: "回到总览" }
};

export default function NextStepGuide({ page }: { page: keyof typeof guides }) {
  const guide = guides[page];

  return (
    <section className="rounded-lg border border-aqua/30 bg-aqua/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-aqua">{guide.title}</p>
          <p className="mt-1 text-sm text-slate-300">{guide.body}</p>
        </div>
        <Link href={guide.href} className="rounded-md bg-aqua px-4 py-2 text-sm font-semibold text-ink transition hover:bg-aqua/90">
          {guide.action}
        </Link>
      </div>
    </section>
  );
}
