import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPDA, deriveProtocolConfigPDA, CREDIT_VAULT_PROGRAM_ID, fetchVaultState, lamportsToUsdc, vaultStatusToString } from "@/lib/anchor-client";
import { extractAuth } from "@/lib/auth";

/**
 * POST /api/vault-yield
 * Returns the instruction data for simulate_yield.
 * Body: { borrower, loanId, pnlAmount (in USDC, e.g. 5.5 or -3.2), auth }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authResult = extractAuth(req.body);
  if (!authResult.valid) return res.status(401).json({ error: authResult.error });

  const { borrower, loanId, pnlAmount } = req.body;
  if (!borrower || !loanId || pnlAmount === undefined) {
    return res.status(400).json({ error: "Missing required fields: borrower, loanId, pnlAmount" });
  }

  try {
    const borrowerPubkey = new PublicKey(borrower);
    const [vault] = deriveVaultPDA(borrowerPubkey, loanId);
    const [protocolConfig] = deriveProtocolConfigPDA();

    // Convert USDC amount to lamports (6 decimals)
    const pnlLamports = Math.round(pnlAmount * 1_000_000);

    return res.status(200).json({
      success: true,
      instruction: {
        programId: CREDIT_VAULT_PROGRAM_ID.toBase58(),
        method: "simulateYield",
        args: { pnlAmount: pnlLamports },
        accounts: {
          authority: authResult.publicKey,
          vault: vault.toBase58(),
          protocolConfig: protocolConfig.toBase58(),
        }
      },
      message: `Simulate yield: ${pnlAmount > 0 ? "+" : ""}${pnlAmount} USDC`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to build yield instruction" });
  }
}
