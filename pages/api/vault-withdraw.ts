import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPDA, deriveVaultAuthorityPDA, CREDIT_VAULT_PROGRAM_ID, fetchVaultState } from "@/lib/anchor-client";
import { extractAuth } from "@/lib/auth";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

/**
 * POST /api/vault-withdraw
 * Returns instruction data for borrower withdrawal after repayment.
 * Body: { loanId, mint, auth }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authResult = extractAuth(req.body);
  if (!authResult.valid) return res.status(401).json({ error: authResult.error });

  const { loanId, mint } = req.body;
  if (!loanId || !mint) {
    return res.status(400).json({ error: "Missing required fields: loanId, mint" });
  }

  try {
    const borrower = new PublicKey(authResult.publicKey!);
    const mintPubkey = new PublicKey(mint);
    const [vault] = deriveVaultPDA(borrower, loanId);
    const [vaultAuthority] = deriveVaultAuthorityPDA(vault);

    // Fetch vault to get lender address
    const vaultData = await fetchVaultState(vault);
    const lenderTokenAccount = await getAssociatedTokenAddress(mintPubkey, vaultData.lender);
    const borrowerTokenAccount = await getAssociatedTokenAddress(mintPubkey, borrower);
    const vaultTokenAccount = await getAssociatedTokenAddress(mintPubkey, vaultAuthority, true);

    return res.status(200).json({
      success: true,
      instruction: {
        programId: CREDIT_VAULT_PROGRAM_ID.toBase58(),
        method: "withdraw",
        accounts: {
          borrower: borrower.toBase58(),
          vault: vault.toBase58(),
          vaultAuthority: vaultAuthority.toBase58(),
          borrowerTokenAccount: borrowerTokenAccount.toBase58(),
          lenderTokenAccount: lenderTokenAccount.toBase58(),
          vaultTokenAccount: vaultTokenAccount.toBase58(),
          tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
        }
      },
      vault: vault.toBase58(),
      message: "Withdraw remaining funds from vault",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to build withdraw instruction" });
  }
}
