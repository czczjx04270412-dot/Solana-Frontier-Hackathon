# Solana Credit Vault - Smart Contract Deployment Guide

## Prerequisites

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup update
```

### 2. Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana --version
```

### 3. Install Anchor CLI
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
anchor --version
```

### 4. Configure Solana for Devnet
```bash
solana config set --url devnet
solana-keygen new  # Generate a wallet if you don't have one
solana airdrop 2   # Get some devnet SOL
```

## Build & Deploy

### Build the contract
```bash
cd programs/credit_vault
anchor build
```

### Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

After deployment, update the `declare_id!()` in `programs/credit_vault/src/lib.rs` and `PROGRAM_ID` in `lib/idl/credit_vault.ts` with the actual deployed program ID.

### Run Tests
```bash
anchor test
```

## Contract Architecture

```
programs/credit_vault/
├── Cargo.toml          # Rust dependencies
└── src/
    ├── lib.rs          # Main program logic (7 instructions)
    ├── state.rs        # Account structures (CreditVault, ProtocolConfig)
    └── errors.rs       # Custom error codes
```

## Instructions

| Instruction | Who Calls | Description |
|---|---|---|
| `initialize_protocol` | Admin | One-time setup: profit share, min ratio, liquidation threshold |
| `initialize_vault` | Borrower | Create vault + deposit collateral + store AI/ZK results |
| `fund_vault` | Lender | Deposit loan amount into vault |
| `simulate_yield` | Keeper/Oracle | Apply P/L from strategy (profit splits, loss waterfall) |
| `liquidate` | Anyone | Execute liquidation when vault_nav < threshold |
| `withdraw` | Borrower | After repayment, claim remaining funds |
| `close_vault` | Borrower | Reclaim rent after final state |

## Key Design Decisions

1. **Off-chain AI + ZK, on-chain state**: Risk scoring and ZK proof generation happen off-chain. Only the results (credit score, proof hash) are stored on-chain.
2. **PDA-controlled vault**: Funds are held in a PDA token account, preventing direct access by either borrower or lender.
3. **Loss waterfall**: Strategy pool absorbs losses first, then collateral. Lender principal is protected until liquidation.
4. **Lender profit lock**: Only `lender_profit_share_bps` (default 5%) of profits go to lender each round, rest compounds.
