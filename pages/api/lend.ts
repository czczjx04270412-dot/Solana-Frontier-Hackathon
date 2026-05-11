import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPDA, fetchVaultState, vaultStatusToString, lamportsToUsdc, CREDIT_VAULT_PROGRAM_ID, deriveVaultAuthorityPDA } from "@/lib/anchor-client";
import { extractAuth } from "@/lib/auth";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

/**
 * POST /api/lend
 * Lender reviews and approves/rejects a vault, returning fund instruction if approved.
 * Body: { borrower, loanId, decision: "approve"|"reject", mint?, auth }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authResult = extractAuth(req.body);
  if (!authResult.valid) return res.status(401).json({ error: authResult.error });

  const { borrower, loanId, decision, mint } = req.body;
  if (!borrower || !loanId || !decision) {
    return res.status(400).json({ error: "Missing required fields: borrower, loanId, decision" });
  }

  if (decision !== "approve" && decision !== "reject") {
    return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });
  }

  try {
    const lender = new PublicKey(authResult.publicKey!);
    const borrowerPubkey = new PublicKey(borrower);
    const [vault] = deriveVaultPDA(borrowerPubkey, loanId);

    // Fetch current vault state
    let vaultData;
    try {
      vaultData = await fetchVaultState(vault);
    } catch {
      return res.status(404).json({ error: "Vault not found on-chain" });
    }

    const status = vaultStatusToString(vaultData.status);
    if (status !== "pending") {
      return res.status(400).json({
        error: `Vault is already '${status}', cannot review`,
        currentState: {
          status,
          loanAmount: lamportsToUsdc(vaultData.loanAmount),
          collateralAmount: lamportsToUsdc(vaultData.collateralAmount),
        }
      });
    }

    // Rejection: just record the decision
    if (decision === "reject") {
      return res.status(200).json({
        success: true,
        decision: "rejected",
        vault: vault.toBase58(),
        message: "Lender rejected the loan request. No on-chain transaction needed.",
      });
    }

    // Approval: return the fund_vault instruction for the lender to sign
    const mintPubkey = new PublicKey(mint ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Default USDC mint
    const [vaultAuthority] = deriveVaultAuthorityPDA(vault);
    const lenderTokenAccount = await getAssociatedTokenAddress(mintPubkey, lender);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintPubkey, vaultAuthority, true);

    return res.status(200).json({
      success: true,
      decision: "approved",
      vault: vault.toBase58(),
      loanDetails: {
        loanAmount: lamportsToUsdc(vaultData.loanAmount),
        collateralAmount: lamportsToUsdc(vaultData.collateralAmount),
        creditScore: vaultData.creditScore,
        approved: vaultData.approved,
      },
      instruction: {
        programId: CREDIT_VAULT_PROGRAM_ID.toBase58(),
        method: "fundVault",
        accounts: {
          lender: lender.toBase58(),
          vault: vault.toBase58(),
          vaultAuthority: vaultAuthority.toBase58(),
          lenderTokenAccount: lenderTokenAccount.toBase58(),
          vaultTokenAccount: vaultTokenAccount.toBase58(),
          mint: mintPubkey.toBase58(),
          tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
        }
      },
      message: "Lender approved. Sign the fund_vault transaction to deposit funds.",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to process lend decision" });
  }
}
