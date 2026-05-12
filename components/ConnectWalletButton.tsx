import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import AddressDisplay from "./AddressDisplay";

export default function ConnectWalletButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const address = publicKey?.toBase58();

  return (
    <div className="flex items-center gap-3">
      {address ? (
        <span className="hidden max-w-[140px] rounded-md border border-line bg-panel px-3 py-2 text-xs text-slate-300 sm:inline">
          <AddressDisplay address={address} />
        </span>
      ) : null}
      <button
        onClick={() => {
          if (connected) {
            disconnect();
            return;
          }
          setVisible(true);
        }}
        className="wallet-button"
      >
        {connected ? "Disconnect" : "Connect Wallet"}
      </button>
    </div>
  );
}
