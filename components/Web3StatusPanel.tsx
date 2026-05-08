import { useWallet } from "@solana/wallet-adapter-react";

export default function Web3StatusPanel() {
  const { connected, publicKey } = useWallet();
  const address = publicKey?.toBase58();

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">网络</p>
          <p className="mt-1 font-semibold text-aqua">Solana Devnet 模拟</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">钱包状态</p>
          <p className={connected ? "mt-1 font-semibold text-lime" : "mt-1 font-semibold text-amber"}>
            {connected ? "已连接" : "未连接"}
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">当前地址</p>
          <p className="mt-1 truncate font-semibold">{address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "等待连接"}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">交易状态</p>
          <p className="mt-1 font-semibold text-slate-200">签名 / Pending / Success 可接入</p>
        </div>
      </div>
    </section>
  );
}
