import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function ConnectWalletButton() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();

  return (
    <div className="flex items-center gap-3">
      {address ? (
        <span className="hidden rounded-md border border-line bg-panel px-3 py-2 text-xs text-slate-300 sm:inline">
          {address.slice(0, 4)}...{address.slice(-4)}
        </span>
      ) : null}
      <WalletMultiButton className="wallet-button" />
    </div>
  );
}
