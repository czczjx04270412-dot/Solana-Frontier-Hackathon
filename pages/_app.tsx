import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import "@/styles/globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { LoanProvider } from "@/lib/LoanContext";

const SolanaWalletProvider = dynamic(
  () => import("@/lib/wallet").then((mod) => mod.SolanaWalletProvider),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SolanaWalletProvider>
      <LoanProvider>
        <Component {...pageProps} />
      </LoanProvider>
    </SolanaWalletProvider>
  );
}
