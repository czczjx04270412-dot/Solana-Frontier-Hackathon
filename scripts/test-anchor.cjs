// Quick test: can we create a Program and call .account.creditVault.all()?
const { ProxyAgent, setGlobalDispatcher } = require("undici");
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) { setGlobalDispatcher(new ProxyAgent(proxy)); }

const { AnchorProvider, Program } = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair } = require("@solana/web3.js");

// Inline minimal IDL with address + types for Anchor 0.32
const IDL = {
  version: "0.1.0",
  name: "credit_vault",
  address: "4QP9SXSrW7pqaJqFFj9y5MWYfZ62dHMvpWLrZ7wmYMvZ",
  instructions: [],
  accounts: [
    {
      name: "CreditVault",
      discriminator: [143,180,135,248,84,85,183,70],
      type: {
        kind: "struct",
        fields: [
          { name: "bump", type: "u8" },
          { name: "borrower", type: "pubkey" },
          { name: "lender", type: "pubkey" },
          { name: "loanAmount", type: "u64" },
        ],
      },
    },
    {
      name: "ProtocolConfig",
      discriminator: [207,91,250,28,152,179,215,209],
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "pubkey" },
          { name: "lenderProfitShareBps", type: "u16" },
        ],
      },
    },
  ],
  types: [
    {
      name: "CreditVault",
      type: {
        kind: "struct",
        fields: [
          { name: "bump", type: "u8" },
          { name: "borrower", type: "pubkey" },
          { name: "lender", type: "pubkey" },
          { name: "loanAmount", type: "u64" },
        ],
      },
    },
    {
      name: "ProtocolConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "pubkey" },
          { name: "lenderProfitShareBps", type: "u16" },
        ],
      },
    },
  ],
};

(async () => {
  const conn = new Connection("https://api.devnet.solana.com", "confirmed");
  const kp = Keypair.generate();
  const w = { publicKey: kp.publicKey, signTransaction: async (t) => t, signAllTransactions: async (t) => t };
  const prov = new AnchorProvider(conn, w, { commitment: "confirmed" });
  
  const prog = new Program(IDL, prov);
  console.log("Program ID:", prog.programId.toBase58());
  console.log("Account keys:", Object.keys(prog.account));
  
  const vaults = await prog.account.creditVault.all();
  console.log("Vaults found:", vaults.length);
})().catch(e => console.error("ERR:", e.message));
