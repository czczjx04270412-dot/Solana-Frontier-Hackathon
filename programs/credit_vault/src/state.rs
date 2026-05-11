use anchor_lang::prelude::*;

/// Risk level stored on-chain (derived from AI + ZK off-chain computation)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum RiskLevel {
    VeryLow,
    Low,
    Medium,
    Elevated,
    High,
    Liquidation,
}

/// Vault lifecycle status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum VaultStatus {
    /// Created by borrower, awaiting lender funding
    Pending,
    /// Lender has deposited funds
    Funded,
    /// Strategy is active, P/L accruing
    Strategy,
    /// Strategy incurred a loss (still active)
    Loss,
    /// Collateral ratio fell below liquidation threshold
    Liquidated,
    /// Loan fully repaid (principal + interest)
    Repaid,
    /// Borrower withdrew remaining funds after repayment
    Withdrawn,
}

/// Main Vault account - holds all loan state on-chain
#[account]
#[derive(InitSpace)]
pub struct CreditVault {
    /// Vault authority PDA bump
    pub bump: u8,

    /// Borrower's public key
    pub borrower: Pubkey,

    /// Lender's public key (set when funded)
    pub lender: Pubkey,

    /// Loan amount in USDC lamports (6 decimals)
    pub loan_amount: u64,

    /// Borrower collateral in USDC lamports
    pub collateral_amount: u64,

    /// Current collateral after losses
    pub current_collateral: u64,

    /// Interest due to lender (in USDC lamports)
    pub interest_due: u64,

    /// Amount repaid so far (lender profit locked)
    pub lender_profit_locked: u64,

    /// Strategy reinvest pool (borrower's accumulated profit)
    pub strategy_reinvest_pool: u64,

    /// Total vault NAV (Net Asset Value)
    pub vault_nav: u64,

    /// AI credit score (0-100)
    pub credit_score: u8,

    /// Risk level from AI assessment
    pub risk_level: RiskLevel,

    /// Whether AI + ZK approved this loan
    pub approved: bool,

    /// Current vault status
    pub status: VaultStatus,

    /// ZK proof hash (sha256 of the proof data, stored for verification reference)
    #[max_len(64)]
    pub zk_proof_hash: String,

    /// Collateral ratio in basis points (e.g., 18000 = 180%)
    pub collateral_ratio_bps: u16,

    /// Timestamp when vault was created
    pub created_at: i64,

    /// Timestamp of last yield simulation
    pub last_yield_at: i64,

    /// Cumulative P/L in lamports (can be negative, stored as i64)
    pub cumulative_pnl: i64,

    /// Number of yield simulation rounds
    pub yield_rounds: u16,
}

/// Protocol-level configuration
#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    /// Admin authority
    pub admin: Pubkey,

    /// Lender profit share in basis points (e.g., 500 = 5%)
    pub lender_profit_share_bps: u16,

    /// Minimum collateral ratio in basis points (e.g., 12000 = 120%)
    pub min_collateral_ratio_bps: u16,

    /// Liquidation threshold in basis points
    pub liquidation_threshold_bps: u16,

    /// Minimum credit score to approve
    pub min_credit_score: u8,

    /// Protocol bump
    pub bump: u8,
}
