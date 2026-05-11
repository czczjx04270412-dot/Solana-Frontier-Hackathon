import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPDA, deriveVaultAuthorityPDA, CREDIT_VAULT_PROGRAM_ID } from "@/lib/anchor-client";
import { extractAuth } from "@/lib/auth";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

/**
 * POST /api/vault-fund
 * Returns accounts needed for the lender to sign a fund_vault transaction.
 * Body: { borrower, loanId, mint, auth }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authResult = extractAuth(req.body);
  if (!authResult.valid) return res.status(401).json({ error: authResult.error });

  const { borrower, loanId, mint } = req.body;
  if (!borrower || !loanId || !mint) {
    return res.status(400).json({ error: "Missing required fields: borrower, loanId, mint" });
  }

  try {
    const lender = new PublicKey(authResult.publicKey!);
    const borrowerPubkey = new PublicKey(borrower);
    const mintPubkey = new PublicKey(mint);
    const [vault] = deriveVaultPDA(borrowerPubkey, loanId);
    const [vaultAuthority] = deriveVaultAuthorityPDA(vault);

    const lenderTokenAccount = await getAssociatedTokenAddress(mintPubkey, lender);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintPubkey, vaultAuthority, true);

    return res.status(200).json({
      success: true,
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
      vault: vault.toBase58(),
      message: `Fund vault for loan ${loanId}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to build fund instruction" });
  }
}
