import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

/**
 * Hook that provides a signAuth function for creating signed payloads.
 * Used by the frontend to authenticate API calls with the connected wallet.
 */
export function useWalletAuth() {
  const { publicKey, signMessage, connected } = useWallet();

  const signAuth = useCallback(async () => {
    if (!publicKey || !signMessage || !connected) {
      throw new Error("Wallet not connected or does not support message signing");
    }

    const timestamp = Date.now();
    const message = `CreditVault:${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = await signMessage(messageBytes);

    return {
      publicKey: publicKey.toBase58(),
      signature: bs58.encode(signature),
      message,
    };
  }, [publicKey, signMessage, connected]);

  /**
   * Make an authenticated API call
   */
  const authFetch = useCallback(async (url: string, body: Record<string, any>) => {
    const auth = await signAuth();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, auth }),
    });
    return res.json();
  }, [signAuth]);

  return { signAuth, authFetch, canSign: connected && !!signMessage };
}
