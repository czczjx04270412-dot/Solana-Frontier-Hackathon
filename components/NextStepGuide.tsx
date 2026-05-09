import Link from "next/link";

const guides: Record<string, { title: string; body: string; href: string; action: string }> = {
  dashboard: { title: "下一步", body: "从借方页面发起一笔融资申请，开始完整 Demo 流程。", href: "/borrow", action: "去借方页面" },
  borrow: { title: "下一步", body: "申请提交后，到风控后台完成借款准入审核。", href: "/risk-admin", action: "去风控后台" },
  lend: { title: "下一步", body: "贷方发起放款后，需要后台确认资金入 Vault。", href: "/risk-admin", action: "去确认放款" },
  vault: { title: "下一步", body: "策略运行后，到结算页查看双方收益归属和退出条件。", href: "/repay", action: "去结算页面" },
  repay: { title: "下一步", body: "结算完成后，可以回到总览重新演示完整流程。", href: "/dashboard", action: "回到总览" },
  "risk-admin": { title: "演示闭环", body: "审核通过后，回到贷方或 Vault 页面继续推进流程。", href: "/lend", action: "去贷方页面" }
};

export default function NextStepGuide({ page }: { page: keyof typeof guides }) {
  const guide = guides[page];

  return (
    <section className="rounded-md border border-aqua/25 bg-aqua/8 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-aqua">{guide.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{guide.body}</p>
        </div>
        <Link href={guide.href} className="rounded bg-aqua px-4 py-2 text-sm font-semibold text-ink transition hover:bg-aqua/90">
          {guide.action}
        </Link>
      </div>
    </section>
  );
}
