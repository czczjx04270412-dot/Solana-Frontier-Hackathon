import { useWallet } from "@solana/wallet-adapter-react";

export default function Web3StatusPanel() {
  const { connected, publicKey } = useWallet();
  const address = publicKey?.toBase58();

  return (
    <section className="rounded-md border border-line bg-panel p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatusItem label="网络" value="Solana Devnet" tone="text-aqua" />
        <StatusItem label="钱包状态" value={connected ? "已连接" : "未连接"} tone={connected ? "text-lime" : "text-amber"} />
        <StatusItem label="当前地址" value={address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "等待连接"} />
        <StatusItem label="交易状态" value="签名 / Pending / Success 可接入" />
      </div>
    </section>
  );
}

function StatusItem({ label, value, tone = "text-slate-100" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-ink p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 truncate font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
