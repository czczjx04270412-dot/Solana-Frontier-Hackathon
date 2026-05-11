/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  CREDIT_VAULT_PROGRAM_ID,
  deriveVaultPDA,
  deriveProtocolConfigPDA,
  fetchVaultState,
  fetchAllVaults,
  vaultStatusToString,
  riskLevelToString,
  lamportsToUsdc,
  usdcToLamports,
  stringToRiskLevel,
  VaultAccountData,
} from "./anchor-client";
import { IDL } from "./idl/credit_vault";

export interface OnChainVault {
  address: string;
  borrower: string;
  lender: string;
  loanAmount: number;
  collateralAmount: number;
  currentCollateral: number;
  interestDue: number;
  lenderProfitLocked: number;
  strategyReinvestPool: number;
  vaultNav: number;
  creditScore: number;
  riskLevel: string;
  approved: boolean;
  status: string;
  zkProofHash: string;
  collateralRatioBps: number;
  cumulativePnl: number;
  yieldRounds: number;
}

function formatVaultData(address: string, data: VaultAccountData): OnChainVault {
  return {
    address,
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
    cumulativePnl: lamportsToUsdc(data.cumulativePnl),
    yieldRounds: data.yieldRounds,
  };
}

/**
 * Hook for reading on-chain vault state.
 * Polls every 10 seconds when a wallet is connected.
 */
export function useOnChainVaults() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [vaults, setVaults] = useState<OnChainVault[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!connected) {
      setVaults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allVaults = await fetchAllVaults();
      const formatted = allVaults.map((v) =>
        formatVaultData(v.publicKey.toBase58(), v.account)
      );
      setVaults(formatted);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch vaults");
    } finally {
      setLoading(false);
    }
  }, [connected]);

  useEffect(() => {
    refresh();
    if (!connected) return;
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh, connected]);

  return { vaults, loading, error, refresh };
}

/**
 * Hook for writing on-chain transactions (init vault, simulate yield, etc.)
 */
export function useVaultTransactions() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pending, setPending] = useState(false);

  const getProvider = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected");
    }
    return new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
  }, [connection, wallet]);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    // @ts-ignore - Anchor 0.32 uses 2-arg: (idl, provider)
    return new Program(IDL as any, provider);
  }, [getProvider]);

  /**
   * Initialize a new vault on-chain
   */
  const initVault = useCallback(async (params: {
    loanId: string;
    loanAmount: number;
    collateralAmount: number;
    creditScore: number;
    riskLevel: string;
    collateralRatioBps: number;
    zkProofHash: string;
  }) => {
    setPending(true);
    try {
      const program = getProgram();
      const provider = getProvider();
      const borrower = provider.wallet.publicKey;
      const [vault] = deriveVaultPDA(borrower, params.loanId);
      const [protocolConfig] = deriveProtocolConfigPDA();

      const tx = await program.methods
        .initializeVault(
          params.loanId,
          new BN(usdcToLamports(params.loanAmount)),
          new BN(usdcToLamports(params.collateralAmount)),
          params.creditScore,
          stringToRiskLevel(params.riskLevel),
          params.collateralRatioBps,
          params.zkProofHash
        )
        .accounts({
          borrower,
          vault,
          protocolConfig,
          systemProgram: PublicKey.default,
        })
        .rpc();

      return { success: true, tx, vault: vault.toBase58() };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setPending(false);
    }
  }, [getProgram, getProvider]);

  /**
   * Simulate yield on-chain
   */
  const simulateYield = useCallback(async (params: {
    borrower: string;
    loanId: string;
    pnlAmount: number; // USDC
  }) => {
    setPending(true);
    try {
      const program = getProgram();
      const provider = getProvider();
      const borrowerPubkey = new PublicKey(params.borrower);
      const [vault] = deriveVaultPDA(borrowerPubkey, params.loanId);
      const [protocolConfig] = deriveProtocolConfigPDA();

      const tx = await program.methods
        .simulateYield(new BN(usdcToLamports(params.pnlAmount)))
        .accounts({
          authority: provider.wallet.publicKey,
          vault,
          protocolConfig,
        })
        .rpc();

      return { success: true, tx };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setPending(false);
    }
  }, [getProgram, getProvider]);

  /**
   * Trigger liquidation on-chain
   */
  const liquidate = useCallback(async (params: {
    borrower: string;
    loanId: string;
  }) => {
    setPending(true);
    try {
      const program = getProgram();
      const provider = getProvider();
      const borrowerPubkey = new PublicKey(params.borrower);
      const [vault] = deriveVaultPDA(borrowerPubkey, params.loanId);
      const [protocolConfig] = deriveProtocolConfigPDA();

      const tx = await program.methods
        .liquidate()
        .accounts({
          liquidator: provider.wallet.publicKey,
          vault,
          protocolConfig,
        })
        .rpc();

      return { success: true, tx };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setPending(false);
    }
  }, [getProgram, getProvider]);

  return { initVault, simulateYield, liquidate, pending };
}
