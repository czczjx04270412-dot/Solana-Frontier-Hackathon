import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import ConnectWalletButton from "./ConnectWalletButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/borrow", label: "Borrow" },
  { href: "/lend", label: "Lend" },
  { href: "/vault", label: "Vault" },
  { href: "/repay", label: "Repay" }
];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(40,215,196,0.16),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(166,232,111,0.12),transparent_30%)]" />
      <header className="border-b border-line/80 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-aqua/40 bg-aqua/10 font-semibold text-aqua">
              SV
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">Solana Vault Credit</span>
              <span className="block text-xs text-slate-400">AI risk, ZK display, controlled funds</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm transition ${
                    active ? "bg-aqua/12 text-aqua" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
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
