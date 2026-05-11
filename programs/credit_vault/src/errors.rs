use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Collateral ratio is below the minimum required threshold")]
    InsufficientCollateralRatio,

    #[msg("Credit score is below the minimum required for approval")]
    CreditScoreTooLow,

    #[msg("Loan was not approved by AI/ZK risk assessment")]
    LoanNotApproved,

    #[msg("Vault is not in the correct status for this operation")]
    InvalidVaultStatus,

    #[msg("Only the borrower can perform this action")]
    UnauthorizedBorrower,

    #[msg("Only the lender can perform this action")]
    UnauthorizedLender,

    #[msg("Only the admin can perform this action")]
    UnauthorizedAdmin,

    #[msg("Vault has been liquidated, no further operations allowed")]
    VaultLiquidated,

    #[msg("Loan has not been fully repaid yet")]
    LoanNotRepaid,

    #[msg("Arithmetic overflow occurred")]
    MathOverflow,

    #[msg("Collateral ratio fell below liquidation threshold")]
    LiquidationTriggered,

    #[msg("Invalid profit/loss amount")]
    InvalidPnlAmount,

    #[msg("Vault is already funded")]
    AlreadyFunded,

    #[msg("ZK proof hash is required for vault initialization")]
    MissingZkProofHash,
}
