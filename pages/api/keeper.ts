import type { NextApiRequest, NextApiResponse } from "next";
import {
  fetchAllVaults,
  fetchProtocolConfig,
  vaultStatusToString,
  lamportsToUsdc,
  deriveProtocolConfigPDA,
  CREDIT_VAULT_PROGRAM_ID,
} from "@/lib/anchor-client";

/**
 * GET /api/keeper
 * Scans all vaults and returns those that need liquidation.
 * 
 * POST /api/keeper
 * Scans and returns liquidation instructions for undercollateralized vaults.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch protocol config for thresholds
    let config;
    try {
      config = await fetchProtocolConfig();
    } catch {
      return res.status(200).json({
        success: true,
        message: "Protocol not initialized yet. No vaults to monitor.",
        atRisk: [],
        liquidatable: [],
      });
    }

    const liquidationThresholdBps = config.liquidationThresholdBps;

    // Fetch all active vaults
    const allVaults = await fetchAllVaults();

    const results = allVaults.map((v) => {
      const data = v.account;
      const status = vaultStatusToString(data.status);
      const loanAmount = data.loanAmount.toNumber();
      const vaultNav = data.vaultNav.toNumber();
      const collateralRatio = loanAmount > 0 ? Math.round((vaultNav / loanAmount) * 10000) : 99999;
      const isActive = status === "funded" || status === "strategy" || status === "loss";

      return {
        vault: v.publicKey.toBase58(),
        borrower: data.borrower.toBase58(),
        status,
        loanAmount: lamportsToUsdc(loanAmount),
        vaultNav: lamportsToUsdc(vaultNav),
        currentCollateral: lamportsToUsdc(data.currentCollateral),
        collateralRatioBps: collateralRatio,
        liquidationThresholdBps,
        isActive,
        needsLiquidation: isActive && collateralRatio < liquidationThresholdBps,
        isAtRisk: isActive && collateralRatio < liquidationThresholdBps + 2000, // within 20% of threshold
      };
    });

    const liquidatable = results.filter((r) => r.needsLiquidation);
    const atRisk = results.filter((r) => r.isAtRisk && !r.needsLiquidation);

    if (req.method === "POST" && liquidatable.length > 0) {
      const [protocolConfig] = deriveProtocolConfigPDA();

      const instructions = liquidatable.map((v) => ({
        vault: v.vault,
        borrower: v.borrower,
        instruction: {
          programId: CREDIT_VAULT_PROGRAM_ID.toBase58(),
          method: "liquidate",
          accounts: {
            vault: v.vault,
            protocolConfig: protocolConfig.toBase58(),
          }
        }
      }));

      return res.status(200).json({
        success: true,
        totalVaults: allVaults.length,
        liquidatable: instructions,
        atRisk: atRisk.map((r) => ({ vault: r.vault, collateralRatioBps: r.collateralRatioBps })),
        message: `${liquidatable.length} vault(s) need liquidation`,
      });
    }

    return res.status(200).json({
      success: true,
      totalVaults: allVaults.length,
      activeVaults: results.filter((r) => r.isActive).length,
      liquidatable: liquidatable.map((r) => ({
        vault: r.vault,
        collateralRatioBps: r.collateralRatioBps,
        vaultNav: r.vaultNav,
      })),
      atRisk: atRisk.map((r) => ({
        vault: r.vault,
        collateralRatioBps: r.collateralRatioBps,
        vaultNav: r.vaultNav,
      })),
      config: {
        liquidationThresholdBps,
        minCollateralRatioBps: config.minCollateralRatioBps,
        lenderProfitShareBps: config.lenderProfitShareBps,
      },
      message: liquidatable.length > 0
        ? `⚠ ${liquidatable.length} vault(s) below liquidation threshold`
        : `✓ All ${results.filter((r) => r.isActive).length} active vaults healthy`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Keeper check failed" });
  }
}
