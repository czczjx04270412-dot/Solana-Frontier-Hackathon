import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import ConnectWalletButton from "./ConnectWalletButton";

const navItems = [
  { href: "/dashboard", label: "总览" },
  { href: "/borrow", label: "借方" },
  { href: "/lend", label: "贷方" },
  { href: "/vault", label: "Vault" },
  { href: "/repay", label: "结算" },
  { href: "/risk-admin", label: "风控后台" }
];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(45,212,191,0.08),transparent_26%),radial-gradient(circle_at_85%_0%,rgba(132,204,22,0.08),transparent_28%)]" />
      <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-aqua/35 bg-aqua/10 text-sm font-bold text-aqua">
              SV
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-wide">Solana 融资 Vault</span>
              <span className="block truncate text-xs text-slate-500">AI 风控 · ZK 隐私证明 · 受控资金使用</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-md border border-line bg-panel/70 p-1 lg:flex">
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-2 text-sm transition ${
                    active ? "bg-aqua text-ink" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <ConnectWalletButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-7">{children}</main>
    </div>
  );
}
