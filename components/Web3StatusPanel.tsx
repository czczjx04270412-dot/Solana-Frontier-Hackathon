import { useWallet } from "@solana/wallet-adapter-react";

export default function Web3StatusPanel() {
  const { connected, publicKey } = useWallet();
  const address = publicKey?.toBase58();

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Network</p>
          <p className="mt-1 font-semibold text-aqua">Solana Devnet</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Wallet Status</p>
          <p className={connected ? "mt-1 font-semibold text-lime" : "mt-1 font-semibold text-amber"}>
            {connected ? "Connected" : "Not Connected"}
          </p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Address</p>
          <p className="mt-1 truncate font-semibold">{address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "Awaiting Connection"}</p>
        </div>
        <div className="rounded-md bg-black/20 p-3">
          <p className="text-xs text-slate-500">Program ID</p>
          <p className="mt-1 truncate font-mono text-xs font-semibold text-aqua" title="4QP9SXSrW7pqaJqFFj9y5MWYfZ62dHMvpWLrZ7wmYMvZ">4QP9SX...wmYMvZ ✓</p>
        </div>
      </div>
    </section>
  );
}
