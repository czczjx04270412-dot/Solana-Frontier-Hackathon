/**
 * One-time: Initialize protocol config on-chain (CommonJS version).
 * node scripts/init-protocol.cjs
 */
const { ProxyAgent, setGlobalDispatcher } = require("undici");
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) { setGlobalDispatcher(new ProxyAgent(proxy)); console.log("Proxy:", proxy); }

const { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } = require("@solana/web3.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = "4QP9SXSrW7pqaJqFFj9y5MWYfZ62dHMvpWLrZ7wmYMvZ";
const RPC = "https://api.devnet.solana.com";

function disc(name) {
  return crypto.createHash("sha256").update("global:" + name).digest().subarray(0, 8);
}

(async () => {
  const home = process.env.USERPROFILE || process.env.HOME;
  const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(home, ".config/solana/id.json"), "utf8"))));
  console.log("Admin:", kp.publicKey.toBase58());

  const conn = new Connection(RPC, "confirmed");
  const pid = new PublicKey(PROGRAM_ID);

  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("protocol_config")], pid);
  console.log("PDA:", pda.toBase58());

  const info = await conn.getAccountInfo(pda);
  if (info) { console.log("Already initialized!", info.data.length, "bytes"); return; }

  // Encode: discriminator(8) + u16 + u16 + u16 + u8 = 15 bytes
  const buf = Buffer.alloc(15);
  disc("initialize_protocol").copy(buf, 0);
  buf.writeUInt16LE(500, 8);    // lender_profit_share_bps = 5%
  buf.writeUInt16LE(12000, 10); // min_collateral_ratio_bps = 120%
  buf.writeUInt16LE(11000, 12); // liquidation_threshold_bps = 110%
  buf.writeUInt8(40, 14);       // min_credit_score

  const ix = new TransactionInstruction({
    programId: pid,
    keys: [
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: kp.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: buf,
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.feePayer = kp.publicKey;
  const bh = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = bh.blockhash;
  tx.sign(kp);

  console.log("Sending...");
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });
  console.log("Sent:", sig);
  await conn.confirmTransaction({ signature: sig, ...bh }, "confirmed");
  console.log("Confirmed! Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
})().catch(e => { console.error("ERR:", e.message); if (e.logs) console.error(e.logs.join("\n")); });
