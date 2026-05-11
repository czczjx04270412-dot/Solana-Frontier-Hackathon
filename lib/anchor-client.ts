/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { IDL, PROGRAM_ID } from "./idl/credit_vault";

// ─── Proxy setup for server-side Solana RPC calls ───────────────────────────
if (typeof window === "undefined") {
  try {
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxy) {
      const { ProxyAgent, setGlobalDispatcher } = require("undici");
      setGlobalDispatcher(new ProxyAgent(proxy));
    }
  } catch (_) {
    // undici not available, skip proxy setup
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const CREDIT_VAULT_PROGRAM_ID = new PublicKey(PROGRAM_ID);
const DEVNET_RPC = "https://api.devnet.solana.com";

// ─── Types ───────────────────────────────────────────────────────────────────
export type VaultStatusOnChain = 
  | { pending: Record<string, never> }
  | { funded: Record<string, never> }
  | { strategy: Record<string, never> }
  | { loss: Record<string, never> }
  | { liquidated: Record<string, never> }
  | { repaid: Record<string, never> }
  | { withdrawn: Record<string, never> };

export type RiskLevelOnChain =
  | { veryLow: Record<string, never> }
  | { low: Record<string, never> }
  | { medium: Record<string, never> }
  | { elevated: Record<string, never> }
  | { high: Record<string, never> }
  | { liquidation: Record<string, never> };

export interface VaultAccountData {
  bump: number;
  borrower: PublicKey;
  lender: PublicKey;
  loanAmount: BN;
  collateralAmount: BN;
  currentCollateral: BN;
  interestDue: BN;
  lenderProfitLocked: BN;
  strategyReinvestPool: BN;
  vaultNav: BN;
  creditScore: number;
  riskLevel: RiskLevelOnChain;
  approved: boolean;
  status: VaultStatusOnChain;
  zkProofHash: string;
  collateralRatioBps: number;
  createdAt: BN;
  lastYieldAt: BN;
  cumulativePnl: BN;
  yieldRounds: number;
}

export interface ProtocolConfigData {
  admin: PublicKey;
  lenderProfitShareBps: number;
  minCollateralRatioBps: number;
  liquidationThresholdBps: number;
  minCreditScore: number;
  bump: number;
}

// ─── PDA Derivation ──────────────────────────────────────────────────────────
export function deriveProtocolConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    CREDIT_VAULT_PROGRAM_ID
  );
}

export function deriveVaultPDA(borrower: PublicKey, loanId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("credit_vault"), borrower.toBuffer(), Buffer.from(loanId)],
    CREDIT_VAULT_PROGRAM_ID
  );
}

export function deriveVaultAuthorityPDA(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_authority"), vault.toBuffer()],
    CREDIT_VAULT_PROGRAM_ID
  );
}

// ─── Connection & Program ────────────────────────────────────────────────────
export function getConnection(): Connection {
  return new Connection(DEVNET_RPC, "confirmed");
}

export function getProgram(provider: AnchorProvider) {
  // @ts-ignore - Anchor 0.32 uses 2-arg: (idl, provider)
  return new Program(IDL as any, provider);
}

export function getReadOnlyProgram() {
  const connection = getConnection();
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: "confirmed" });
  // @ts-ignore - Anchor 0.32 uses 2-arg: (idl, provider)
  return new Program(IDL as any, provider);
}

// ─── Instructions ────────────────────────────────────────────────────────────

/**
 * Initialize protocol configuration (admin only, one-time)
 */
export async function initializeProtocol(
  provider: AnchorProvider,
  params: {
    lenderProfitShareBps: number;
    minCollateralRatioBps: number;
    liquidationThresholdBps: number;
    minCreditScore: number;
  }
) {
  const program = getProgram(provider);
  const [protocolConfig] = deriveProtocolConfigPDA();

  const tx = await program.methods
    .initializeProtocol(
      params.lenderProfitShareBps,
      params.minCollateralRatioBps,
      params.liquidationThresholdBps,
      params.minCreditScore
    )
    .accounts({
      admin: provider.wallet.publicKey,
      protocolConfig,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx, protocolConfig };
}

/**
 * Initialize a new credit vault
 */
export async function initializeVault(
  provider: AnchorProvider,
  params: {
    loanId: string;
    loanAmount: number;
    collateralAmount: number;
    creditScore: number;
    riskLevel: RiskLevelOnChain;
    collateralRatioBps: number;
    zkProofHash: string;
  }
) {
  const program = getProgram(provider);
  const borrower = provider.wallet.publicKey;
  const [vault] = deriveVaultPDA(borrower, params.loanId);
  const [protocolConfig] = deriveProtocolConfigPDA();

  const tx = await program.methods
    .initializeVault(
      params.loanId,
      new BN(params.loanAmount),
      new BN(params.collateralAmount),
      params.creditScore,
      params.riskLevel,
      params.collateralRatioBps,
      params.zkProofHash
    )
    .accounts({
      borrower,
      vault,
      protocolConfig,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx, vault };
}

/**
 * Fund vault (lender deposits funds)
 */
export async function fundVault(
  provider: AnchorProvider,
  params: {
    borrower: PublicKey;
    loanId: string;
    mint: PublicKey;
  }
) {
  const program = getProgram(provider);
  const lender = provider.wallet.publicKey;
  const [vault] = deriveVaultPDA(params.borrower, params.loanId);
  const [vaultAuthority] = deriveVaultAuthorityPDA(vault);

  const lenderTokenAccount = await getAssociatedTokenAddress(params.mint, lender);
  const vaultTokenAccount = await getAssociatedTokenAddress(params.mint, vaultAuthority, true);

  const tx = await program.methods
    .fundVault()
    .accounts({
      lender,
      vault,
      vaultAuthority,
      lenderTokenAccount,
      vaultTokenAccount,
      mint: params.mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return { tx, vault };
}

/**
 * Simulate yield (strategy P/L accrual)
 */
export async function simulateYieldOnChain(
  provider: AnchorProvider,
  params: {
    borrower: PublicKey;
    loanId: string;
    pnlAmount: number; // positive = profit, negative = loss (in lamports)
  }
) {
  const program = getProgram(provider);
  const [vault] = deriveVaultPDA(params.borrower, params.loanId);
  const [protocolConfig] = deriveProtocolConfigPDA();

  const tx = await program.methods
    .simulateYield(new BN(params.pnlAmount))
    .accounts({
      authority: provider.wallet.publicKey,
      vault,
      protocolConfig,
    })
    .rpc();

  return { tx };
}

/**
 * Liquidate vault (when collateral ratio falls below threshold)
 */
export async function liquidateVault(
  provider: AnchorProvider,
  params: {
    borrower: PublicKey;
    loanId: string;
  }
) {
  const program = getProgram(provider);
  const [vault] = deriveVaultPDA(params.borrower, params.loanId);
  const [protocolConfig] = deriveProtocolConfigPDA();

  const tx = await program.methods
    .liquidate()
    .accounts({
      liquidator: provider.wallet.publicKey,
      vault,
      protocolConfig,
    })
    .rpc();

  return { tx };
}

/**
 * Withdraw remaining funds after repayment
 */
export async function withdrawVault(
  provider: AnchorProvider,
  params: {
    loanId: string;
    mint: PublicKey;
  }
) {
  const program = getProgram(provider);
  const borrower = provider.wallet.publicKey;
  const [vault] = deriveVaultPDA(borrower, params.loanId);
  const [vaultAuthority] = deriveVaultAuthorityPDA(vault);

  const borrowerTokenAccount = await getAssociatedTokenAddress(params.mint, borrower);
  const lenderTokenAccount = await getAssociatedTokenAddress(params.mint, (await fetchVaultState(vault)).lender);
  const vaultTokenAccount = await getAssociatedTokenAddress(params.mint, vaultAuthority, true);

  const tx = await program.methods
    .withdraw()
    .accounts({
      borrower,
      vault,
      vaultAuthority,
      borrowerTokenAccount,
      lenderTokenAccount,
      vaultTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return { tx };
}

/**
 * Close vault (cleanup after withdrawal)
 */
export async function closeVault(
  provider: AnchorProvider,
  params: { loanId: string }
) {
  const program = getProgram(provider);
  const borrower = provider.wallet.publicKey;
  const [vault] = deriveVaultPDA(borrower, params.loanId);

  const tx = await program.methods
    .closeVault()
    .accounts({
      borrower,
      vault,
    })
    .rpc();

  return { tx };
}

// ─── Read State ──────────────────────────────────────────────────────────────

export async function fetchVaultState(vaultAddress: PublicKey): Promise<VaultAccountData> {
  const program = getReadOnlyProgram();
  const account = await (program.account as any).creditVault.fetch(vaultAddress);
  return account as unknown as VaultAccountData;
}

export async function fetchProtocolConfig(): Promise<ProtocolConfigData> {
  const program = getReadOnlyProgram();
  const [protocolConfig] = deriveProtocolConfigPDA();
  const account = await (program.account as any).protocolConfig.fetch(protocolConfig);
  return account as unknown as ProtocolConfigData;
}

export async function fetchAllVaults(): Promise<{ publicKey: PublicKey; account: VaultAccountData }[]> {
  const program = getReadOnlyProgram();
  const accounts = await (program.account as any).creditVault.all();
  return accounts as unknown as { publicKey: PublicKey; account: VaultAccountData }[];
}

export async function fetchVaultsByBorrower(borrower: PublicKey): Promise<{ publicKey: PublicKey; account: VaultAccountData }[]> {
  const program = getReadOnlyProgram();
  const accounts = await (program.account as any).creditVault.all([
    { memcmp: { offset: 9, bytes: borrower.toBase58() } }
  ]);
  return accounts as unknown as { publicKey: PublicKey; account: VaultAccountData }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function vaultStatusToString(status: VaultStatusOnChain): string {
  if ("pending" in status) return "pending";
  if ("funded" in status) return "funded";
  if ("strategy" in status) return "strategy";
  if ("loss" in status) return "loss";
  if ("liquidated" in status) return "liquidated";
  if ("repaid" in status) return "repaid";
  if ("withdrawn" in status) return "withdrawn";
  return "unknown";
}

export function riskLevelToString(level: RiskLevelOnChain): string {
  if ("veryLow" in level) return "very-low";
  if ("low" in level) return "low";
  if ("medium" in level) return "medium";
  if ("elevated" in level) return "elevated";
  if ("high" in level) return "high";
  if ("liquidation" in level) return "liquidation";
  return "unknown";
}

export function stringToRiskLevel(level: string): RiskLevelOnChain {
  switch (level) {
    case "very-low": return { veryLow: {} };
    case "low": return { low: {} };
    case "medium": return { medium: {} };
    case "elevated": return { elevated: {} };
    case "high": return { high: {} };
    default: return { liquidation: {} };
  }
}

export function lamportsToUsdc(lamports: BN | number): number {
  const val = typeof lamports === "number" ? lamports : lamports.toNumber();
  return val / 1_000_000; // USDC has 6 decimals
}

export function usdcToLamports(usdc: number): number {
  return Math.round(usdc * 1_000_000);
}
