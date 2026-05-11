/**
 * One-time script: Initialize the protocol config on-chain.
 * Uses raw Solana transactions (no Anchor SDK) to avoid ESM/CJS conflicts.
 * Run with: node scripts/init-protocol.mjs
 */
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) {
  setGlobalDispatcher(new ProxyAgent(proxy));
  console.log("Using proxy:", proxy);
}

import {
  Connection, Keypair, PublicKey, SystemProgram,
  Transaction, TransactionInstruction, sendAndConfirmTransaction,
} from "@solana/web3.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const PROGRAM_ID = "4QP9SXSrW7pqaJqFFj9y5MWYfZ62dHMvpWLrZ7wmYMvZ";
const RPC_URL = "https://api.devnet.solana.com";

const LENDER_PROFIT_SHARE_BPS = 500;
const MIN_COLLATERAL_RATIO_BPS = 12000;
const LIQUIDATION_THRESHOLD_BPS = 11000;
const MIN_CREDIT_SCORE = 40;

// Anchor discriminator: sha256("global:initialize_protocol")[0..8]
function anchorDiscriminator(name) {
  const hash = crypto.createHash("sha256").update(`global:${name}`).digest();
  return hash.subarray(0, 8);
}

function encodeInitProtocolArgs(lenderBps, minCollBps, liqBps, minScore) {
  const disc = anchorDiscriminator("initialize_protocol");
  const buf = Buffer.alloc(8 + 2 + 2 + 2 + 1); // discriminator + 3xu16 + u8
  disc.copy(buf, 0);
  buf.writeUInt16LE(lenderBps, 8);
  buf.writeUInt16LE(minCollBps, 10);
  buf.writeUInt16LE(liqBps, 12);
  buf.writeUInt8(minScore, 14);
  return buf;
}

async function main() {
  const home = process.env.USERPROFILE || process.env.HOME || "~";
  const keypairPath = path.join(home, ".config", "solana", "id.json");
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log("Admin wallet:", keypair.publicKey.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");
  const programId = new PublicKey(PROGRAM_ID);

  const [protocolConfig, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    programId
  );

  console.log("Protocol Config PDA:", protocolConfig.toBase58());
  console.log("Bump:", bump);
  console.log("Parameters:");
  console.log("  Lender Profit Share:", LENDER_PROFIT_SHARE_BPS / 100, "%");
  console.log("  Min Collateral Ratio:", MIN_COLLATERAL_RATIO_BPS / 100, "%");
  console.log("  Liquidation Threshold:", LIQUIDATION_THRESHOLD_BPS / 100, "%");
  console.log("  Min Credit Score:", MIN_CREDIT_SCORE);

  const accountInfo = await connection.getAccountInfo(protocolConfig);
  if (accountInfo) {
    console.log("\nProtocol config already initialized! Account size:", accountInfo.data.length, "bytes");
    console.log("Done - no action needed.");
    return;
  }

  const data = encodeInitProtocolArgs(
    LENDER_PROFIT_SHARE_BPS,
    MIN_COLLATERAL_RATIO_BPS,
    LIQUIDATION_THRESHOLD_BPS,
    MIN_CREDIT_SCORE
  );

  const ix = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: protocolConfig, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  console.log("\nInitializing protocol...");
  try {
    const tx = new Transaction().add(ix);
    tx.feePayer = keypair.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.sign(keypair);
    const rawTx = tx.serialize();
    console.log("Tx signed by:", keypair.publicKey.toBase58());
    console.log("Tx signers count:", tx.signatures.length);
    console.log("Instruction keys:", ix.keys.map(k => ({pubkey: k.pubkey.toBase58().slice(0,8), isSigner: k.isSigner, isWritable: k.isWritable})));
    const sig = await connection.sendRawTransaction(rawTx, { skipPreflight: true });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    console.log("Protocol initialized!");
    console.log("Transaction:", sig);
    console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
  } catch (err) {
    console.error("Failed:", err.message);
    if (err.logs) {
      console.error("Logs:", err.logs.join("\n"));
    }
  }
}

main().catch(console.error);
