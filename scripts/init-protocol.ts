/**
 * One-time script: Initialize the protocol config on-chain.
 * Run with: npx ts-node --esm scripts/init-protocol.ts
 * Or via the deploy script after deployment.
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = "4QP9SXSrW7pqaJqFFj9y5MWYfZ62dHMvpWLrZ7wmYMvZ";
const RPC_URL = "https://api.devnet.solana.com";

// Protocol parameters
const LENDER_PROFIT_SHARE_BPS = 500; // 5%
const MIN_COLLATERAL_RATIO_BPS = 12000; // 120%
const LIQUIDATION_THRESHOLD_BPS = 11000; // 110%
const MIN_CREDIT_SCORE = 40;

async function main() {
  // Load keypair
  const keypairPath = path.join(process.env.USERPROFILE || process.env.HOME || "~", ".config/solana/id.json");
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log("Admin wallet:", keypair.publicKey.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => { tx.sign(keypair); return tx; },
    signAllTransactions: async (txs: any[]) => { txs.forEach(tx => tx.sign(keypair)); return txs; },
  };

  const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });

  // Load IDL
  const idlPath = path.join(__dirname, "../lib/idl/credit_vault.ts");
  // For simplicity, we'll construct the instruction manually
  const programId = new PublicKey(PROGRAM_ID);

  // Derive protocol config PDA
  const [protocolConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    programId
  );

  console.log("Protocol Config PDA:", protocolConfig.toBase58());
  console.log("Parameters:");
  console.log("  Lender Profit Share:", LENDER_PROFIT_SHARE_BPS / 100, "%");
  console.log("  Min Collateral Ratio:", MIN_COLLATERAL_RATIO_BPS / 100, "%");
  console.log("  Liquidation Threshold:", LIQUIDATION_THRESHOLD_BPS / 100, "%");
  console.log("  Min Credit Score:", MIN_CREDIT_SCORE);

  // Check if already initialized
  const accountInfo = await connection.getAccountInfo(protocolConfig);
  if (accountInfo) {
    console.log("\n⚠ Protocol config already initialized! Account size:", accountInfo.data.length, "bytes");
    console.log("If you need to reinitialize, close the account first.");
    return;
  }

  // Use the IDL to call initialize_protocol
  const IDL = require("../lib/idl/credit_vault").IDL;
  // @ts-ignore
  const program = new Program(IDL as any, programId, provider);

  console.log("\nInitializing protocol...");
  try {
    const tx = await (program.methods as any)
      .initializeProtocol(
        LENDER_PROFIT_SHARE_BPS,
        MIN_COLLATERAL_RATIO_BPS,
        LIQUIDATION_THRESHOLD_BPS,
        MIN_CREDIT_SCORE
      )
      .accounts({
        admin: keypair.publicKey,
        protocolConfig,
        systemProgram: PublicKey.default,
      })
      .rpc();

    console.log("✅ Protocol initialized!");
    console.log("Transaction:", tx);
    console.log("Explorer: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
  } catch (err: any) {
    console.error("❌ Failed:", err.message);
    if (err.logs) {
      console.error("Logs:", err.logs.join("\n"));
    }
  }
}

main().catch(console.error);
