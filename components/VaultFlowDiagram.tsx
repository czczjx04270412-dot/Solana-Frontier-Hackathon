import type { Loan } from "@/lib/types";

const nodes = [
  { label: "Lender Funds", note: "放款资金" },
  { label: "Vault", note: "受控资金池" },
  { label: "Strategy", note: "收益策略 mock" },
  { label: "Repay Split", note: "自动还款分配" }
];

export default function VaultFlowDiagram({ loan }: { loan: Loan | null }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Vault Flow</p>
          <h2 className="mt-2 text-xl font-semibold">资金不能直接进入用户钱包</h2>
        </div>
        <span className="rounded-md bg-lime/10 px-3 py-2 text-sm text-lime">
          {loan?.vaultStatus ?? "pending"}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {nodes.map((node, index) => (
          <div key={node.label} className="relative rounded-lg border border-line bg-black/20 p-4">
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
