import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPDA, deriveProtocolConfigPDA, CREDIT_VAULT_PROGRAM_ID, usdcToLamports, stringToRiskLevel } from "@/lib/anchor-client";
import { extractAuth } from "@/lib/auth";

/**
 * POST /api/vault-init
 * Creates a vault initialization transaction for the borrower to sign.
 * Body: { loanId, loanAmount, collateralAmount, creditScore, riskLevel, collateralRatioBps, zkProofHash, auth }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authResult = extractAuth(req.body);
  if (!authResult.valid) return res.status(401).json({ error: authResult.error });

  const { loanId, loanAmount, collateralAmount, creditScore, riskLevel, collateralRatioBps, zkProofHash } = req.body;

  if (!loanId || !loanAmount || !collateralAmount) {
    return res.status(400).json({ error: "Missing required fields: loanId, loanAmount, collateralAmount" });
  }

  try {
    const borrower = new PublicKey(authResult.publicKey!);
    const [vault] = deriveVaultPDA(borrower, loanId);
    const [protocolConfig] = deriveProtocolConfigPDA();

    // Return the instruction data and accounts so the frontend can build + sign the tx
    return res.status(200).json({
      success: true,
      instruction: {
        programId: CREDIT_VAULT_PROGRAM_ID.toBase58(),
        method: "initializeVault",
        args: {
          loanId,
          loanAmount: usdcToLamports(loanAmount),
          collateralAmount: usdcToLamports(collateralAmount),
          creditScore: creditScore ?? 70,
          riskLevel: riskLevel ?? "medium",
          collateralRatioBps: collateralRatioBps ?? Math.round((collateralAmount / loanAmount) * 10000),
          zkProofHash: zkProofHash ?? "",
        },
        accounts: {
          borrower: borrower.toBase58(),
          vault: vault.toBase58(),
          protocolConfig: protocolConfig.toBase58(),
        }
      },
      vault: vault.toBase58(),
      message: `Vault PDA derived for loan ${loanId}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to derive vault" });
  }
}
