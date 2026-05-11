import Link from "next/link";

const guides: Record<string, { title: string; body: string; href: string; action: string }> = {
  dashboard: { title: "Next Step", body: "Enter the borrower application from the overview to start the full financing flow.", href: "/borrow", action: "Go to Borrow" },
  borrow: { title: "Next Step", body: "After completing the borrower application, switch to the lender view to review risk and target yield.", href: "/lend", action: "Go to Lend" },
  lend: { title: "Next Step", body: "After lender confirms funding, enter Vault to see how funds are managed.", href: "/vault", action: "Go to Vault" },
  vault: { title: "Next Step", body: "After strategy runs, go to settlement to view profit allocation and exit conditions.", href: "/repay", action: "Go to Settlement" },
  repay: { title: "Next Step", body: "After settlement, admin risk panel can review full risk factor details.", href: "/risk-admin", action: "Go to Risk Admin" },
  "risk-admin": { title: "Demo Complete", body: "Risk admin explains risk factors. Return to overview to restart the demo.", href: "/dashboard", action: "Back to Overview" }
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
