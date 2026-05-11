import type { NextApiRequest, NextApiResponse } from "next";
import { PublicKey } from "@solana/web3.js";
import {
  deriveVaultPDA,
  fetchVaultState,
  fetchAllVaults,
  fetchVaultsByBorrower,
  vaultStatusToString,
  riskLevelToString,
  lamportsToUsdc,
} from "@/lib/anchor-client";

/**
 * GET /api/vault-state?borrower=xxx&loanId=yyy  → single vault
 * GET /api/vault-state?borrower=xxx             → all vaults for borrower
 * GET /api/vault-state                          → all vaults (admin)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { borrower, loanId } = req.query;

  try {
    // Single vault lookup
    if (borrower && loanId) {
      const borrowerPubkey = new PublicKey(borrower as string);
      const [vault] = deriveVaultPDA(borrowerPubkey, loanId as string);

      try {
        const data = await fetchVaultState(vault);
        return res.status(200).json({
          success: true,
          vault: vault.toBase58(),
          data: formatVault(data),
        });
      } catch {
        return res.status(404).json({ error: "Vault not found on-chain" });
      }
    }

    // All vaults for a borrower
    if (borrower) {
      const borrowerPubkey = new PublicKey(borrower as string);
      const vaults = await fetchVaultsByBorrower(borrowerPubkey);
      return res.status(200).json({
        success: true,
        count: vaults.length,
        vaults: vaults.map((v) => ({
          address: v.publicKey.toBase58(),
          data: formatVault(v.account),
        })),
      });
    }

    // All vaults (admin view)
    const vaults = await fetchAllVaults();
    return res.status(200).json({
      success: true,
      count: vaults.length,
      vaults: vaults.map((v) => ({
        address: v.publicKey.toBase58(),
        data: formatVault(v.account),
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to fetch vault state" });
  }
}

function formatVault(data: any) {
  return {
    borrower: data.borrower.toBase58(),
    lender: data.lender.toBase58(),
    loanAmount: lamportsToUsdc(data.loanAmount),
    collateralAmount: lamportsToUsdc(data.collateralAmount),
    currentCollateral: lamportsToUsdc(data.currentCollateral),
    interestDue: lamportsToUsdc(data.interestDue),
    lenderProfitLocked: lamportsToUsdc(data.lenderProfitLocked),
    strategyReinvestPool: lamportsToUsdc(data.strategyReinvestPool),
    vaultNav: lamportsToUsdc(data.vaultNav),
    creditScore: data.creditScore,
    riskLevel: riskLevelToString(data.riskLevel),
    approved: data.approved,
    status: vaultStatusToString(data.status),
    zkProofHash: data.zkProofHash,
    collateralRatioBps: data.collateralRatioBps,
    createdAt: new Date(data.createdAt.toNumber() * 1000).toISOString(),
    lastYieldAt: data.lastYieldAt.toNumber() > 0 ? new Date(data.lastYieldAt.toNumber() * 1000).toISOString() : null,
    cumulativePnl: lamportsToUsdc(data.cumulativePnl),
    yieldRounds: data.yieldRounds,
  };
}
