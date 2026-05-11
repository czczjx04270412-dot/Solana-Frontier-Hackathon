import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

/**
 * Verify a wallet signature server-side.
 * The frontend signs a message like "CreditVault:{timestamp}" 
 * and sends { publicKey, signature, message } to the API.
 */
export interface SignedPayload {
  publicKey: string;
  signature: string;
  message: string;
}

/**
 * Verify that the signature was produced by the claimed publicKey
 */
export function verifyWalletSignature(payload: SignedPayload): boolean {
  try {
    const pubkey = new PublicKey(payload.publicKey);
    const messageBytes = new TextEncoder().encode(payload.message);
    const signatureBytes = bs58.decode(payload.signature);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, pubkey.toBytes());
  } catch {
    return false;
  }
}

/**
 * Verify signature + check timestamp freshness (within 5 minutes)
 */
export function verifyAuth(payload: SignedPayload): { valid: boolean; error?: string; publicKey?: string } {
  if (!payload.publicKey || !payload.signature || !payload.message) {
    return { valid: false, error: "Missing auth fields" };
  }

  // Check message format: "CreditVault:{timestamp}"
  const parts = payload.message.split(":");
  if (parts.length < 2 || parts[0] !== "CreditVault") {
    return { valid: false, error: "Invalid message format" };
  }

  const timestamp = parseInt(parts[1], 10);
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  if (isNaN(timestamp) || Math.abs(now - timestamp) > fiveMinutes) {
    return { valid: false, error: "Signature expired" };
  }

  if (!verifyWalletSignature(payload)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true, publicKey: payload.publicKey };
}

/**
 * Middleware helper: extract and verify auth from request body
 */
export function extractAuth(body: any): { valid: boolean; error?: string; publicKey?: string } {
  const auth = body?.auth as SignedPayload | undefined;
  if (!auth) {
    return { valid: false, error: "No auth payload provided" };
  }
  return verifyAuth(auth);
}
