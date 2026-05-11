import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPDA, deriveProtocolConfigPDA, CREDIT_VAULT_PROGRAM_ID, fetchVaultState, vaultStatusToString, lamportsToUsdc } from "@/lib/anchor-client";
import { extractAuth } from "@/lib/auth";

/**
 * POST /api/vault-liquidate
 * Returns instruction data for liquidation, or auto-checks if vault should be liquidated.
 * Body: { borrower, loanId, auth }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authResult = extractAuth(req.body);
  if (!authResult.valid) return res.status(401).json({ error: authResult.error });

  const { borrower, loanId } = req.body;
  if (!borrower || !loanId) {
    return res.status(400).json({ error: "Missing required fields: borrower, loanId" });
  }

  try {
    const borrowerPubkey = new PublicKey(borrower);
    const [vault] = deriveVaultPDA(borrowerPubkey, loanId);
    const [protocolConfig] = deriveProtocolConfigPDA();

    // Check current vault state
    let vaultData;
    try {
      vaultData = await fetchVaultState(vault);
    } catch {
      return res.status(404).json({ error: "Vault not found on-chain" });
    }

    const status = vaultStatusToString(vaultData.status);
    if (status === "liquidated" || status === "repaid" || status === "withdrawn") {
      return res.status(400).json({
        error: `Vault already ${status}`,
        vaultStatus: status,
        vaultNav: lamportsToUsdc(vaultData.vaultNav),
      });
    }

    return res.status(200).json({
      success: true,
      instruction: {
        programId: CREDIT_VAULT_PROGRAM_ID.toBase58(),
        method: "liquidate",
        accounts: {
          liquidator: authResult.publicKey,
          vault: vault.toBase58(),
          protocolConfig: protocolConfig.toBase58(),
        }
      },
      currentState: {
        vaultNav: lamportsToUsdc(vaultData.vaultNav),
        loanAmount: lamportsToUsdc(vaultData.loanAmount),
        currentCollateral: lamportsToUsdc(vaultData.currentCollateral),
        status,
      },
      message: "Liquidation instruction prepared",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to build liquidation instruction" });
  }
}
