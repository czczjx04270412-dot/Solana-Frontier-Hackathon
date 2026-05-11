# Solana DeFi Credit Vault

> A controlled on-chain lending protocol on Solana — AI-powered risk scoring, ZK privacy proofs, and a PDA-secured vault that keeps borrower strategy funds fully auditable and lender principal always protected.

---

## Overview

**Solana DeFi Credit Vault** is a decentralized lending protocol where lender funds never leave the protocol's control. Instead of sending money to a borrower's personal wallet, all capital is locked inside a **Program-Derived Address (PDA) vault**. The borrower can only trade whitelisted assets through a controlled interface. Profits are split automatically — 5% locked for the lender each cycle, 95% kept in a strategy reinvest pool — and losses are absorbed by the reinvest pool first, then by borrower collateral, before ever touching the lender's principal.

---

## Key Features

| Feature | Description |
|---|---|
| **PDA-Controlled Vault** | Funds held in a PDA token account — neither borrower nor lender can withdraw unilaterally |
| **AI Risk Engine** | DeepSeek LLM evaluates collateral ratio, strategy risk, yield ability, and market exposure |
| **ZK Privacy Proofs** | snarkjs-based off-chain ZK proofs verify private risk factors without revealing raw data |
| **5% / 95% Profit Split** | Every profitable cycle: 5% locked to lender profit pool, 95% compounds in strategy reinvest pool |
| **Loss Waterfall** | Losses hit strategy reinvest pool → borrower collateral → lender principal (last resort) |
| **Two-Step Admin Approval** | Borrower loan review + Lender funding review before any funds enter the vault |
| **Real-time NAV & Liquidation Line** | Continuous monitoring; automatic liquidation trigger when NAV < 120% of loan amount |
| **On-chain Settlement** | 7 Anchor instructions handle the full lifecycle: initialize → fund → yield → liquidate → withdraw |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                          │
│  Next.js 15 + TypeScript + TailwindCSS + Recharts        │
│  Wallet: Phantom via @solana/wallet-adapter              │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │     API Layer         │
         │  /api/risk-score      │  ← DeepSeek AI
         │  /api/vault-state     │  ← On-chain read
         │  /api/zk-verify       │  ← snarkjs ZK
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Solana Devnet        │
         │  Anchor Program        │
         │  credit_vault          │
         │  (7 instructions)      │
         └───────────────────────┘
```

### On-Chain Program (`programs/credit_vault`)

| File | Purpose |
|---|---|
| `lib.rs` | 7 instructions: full loan lifecycle |
| `state.rs` | `CreditVault` + `ProtocolConfig` account structs |
| `errors.rs` | Custom Anchor error codes |

### Smart Contract Instructions

| Instruction | Caller | Description |
|---|---|---|
| `initialize_protocol` | Admin | One-time setup: profit share BPS, min collateral ratio, liquidation threshold, min credit score |
| `initialize_vault` | Borrower | Create vault PDA, deposit collateral, store AI score + ZK proof hash |
| `fund_vault` | Lender | Deposit loan principal into vault |
| `simulate_yield` | Keeper/Oracle | Apply daily P&L: profit split or loss waterfall |
| `liquidate` | Anyone | Trigger when vault_nav < liquidation threshold |
| `withdraw` | Borrower | Claim remaining funds after settlement |
| `close_vault` | Borrower | Reclaim rent lamports after protocol close |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Solana Devnet |
| **Smart Contract** | Anchor 0.32, Rust |
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | TailwindCSS 3 |
| **Charts** | Recharts |
| **Wallet** | @solana/wallet-adapter (Phantom) |
| **AI Risk Engine** | DeepSeek Chat API (`deepseek-chat`) |
| **ZK Proofs** | snarkjs (Groth16) |
| **RPC Client** | @coral-xyz/anchor 0.32, @solana/web3.js |
| **Token Program** | @solana/spl-token |

---

## How It Works

### Lifecycle

```
1. Borrower submits loan application
        ↓
2. AI risk engine scores the request (DeepSeek)
        ↓
3. ZK proof generated for private risk factors
        ↓
4. Admin Step 1: Loan admission review
        ↓
5. Lender funds the vault
        ↓
6. Admin Step 2: Funding confirmation into vault
        ↓
7. Borrower executes whitelisted strategies (SOL, mSOL, JitoSOL, USDC)
        ↓
8. Each cycle: profit → 5% lender lock + 95% reinvest pool
               loss   → reinvest pool first → collateral
        ↓
9. Exit when lender profit lock pool ≥ target AND vault NAV ≥ principal + locked profit
        ↓
10. Lender withdraws principal + locked profit
    Borrower claims remaining collateral + reinvest pool
```

### Profit & Loss Mechanism

```
Profit Day:
  Vault NAV gain × 5%  → Lender Profit Lock Pool  (cannot be traded)
  Vault NAV gain × 95% → Strategy Reinvest Pool   (borrower continues trading)

Loss Day:
  Loss absorbed by: Strategy Reinvest Pool → Borrower Collateral → [Liquidation]
  Lender Profit Lock Pool is NEVER deducted
  Lender Principal Protection Line is NEVER deducted until liquidation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Rust + Solana CLI + Anchor CLI (for on-chain deployment)
- Phantom Wallet browser extension

### Install & Run (Frontend Demo)

```bash
git clone https://github.com/czczjx04270412-dot/Solana-Frontier-Hackathon
cd Solana-Frontier-Hackathon

npm install
cp .env.local.example .env.local
# Add your DEEPSEEK_API_KEY to .env.local

npm run dev
# Visit http://localhost:3000
```

### Environment Variables

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

### Deploy Smart Contract

See [README-contract.md](./README-contract.md) for full Anchor deployment instructions.

```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — protocol overview, metrics, demo controls |
| `/borrow` | Borrower view — apply for loan, cost breakdown, repayment progress |
| `/lend` | Lender view — browse loan applications, risk cards |
| `/vault` | Vault live operations — controlled trading, NAV, yield chart |
| `/repay` | Settlement — profit ledger, exit conditions, reset |
| `/risk-admin` | Admin panel — two-step approval workflow |
| `/figma-flow` | Protocol flow diagram (pitch/demo page) |

---

## ZK Proof System

Private risk factors (yield history, strategy exposure, default record, asset source, market model) are verified off-chain using **snarkjs Groth16**. Only the proof hash and verification result are stored on-chain, so sensitive borrower data is never exposed publicly.

```
Off-chain:  Private inputs → snarkjs circuit → proof + public signals
On-chain:   proof_hash (bytes32) stored in CreditVault account
Frontend:   ZKProofCard shows verification status per privacy item
```

---

## AI Risk Engine

The DeepSeek API generates a structured JSON risk assessment including:
- **Risk Level**: Low / Medium / High
- **Credit Score**: 0–100
- **Collateral Ratio**: calculated from inputs
- **Target Yield Range**: recommended APY band
- **AI Explanation**: plain-English reasoning for the risk decision

Fallback to local rule-based scoring when API key is unavailable.

---

## License

MIT — built for the Solana Frontier Hackathon.
