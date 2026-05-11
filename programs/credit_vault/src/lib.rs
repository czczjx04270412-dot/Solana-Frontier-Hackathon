use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub mod errors;
pub mod state;

use errors::VaultError;
use state::*;

declare_id!("4QP9SXSrW7pqaJqFFj9y5MWYfZ62dHMvpWLrZ7wmYMvZ");

#[program]
pub mod credit_vault {
    use super::*;

    /// Initialize protocol configuration (admin only, one-time)
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        lender_profit_share_bps: u16,
        min_collateral_ratio_bps: u16,
        liquidation_threshold_bps: u16,
        min_credit_score: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.protocol_config;
        config.admin = ctx.accounts.admin.key();
        config.lender_profit_share_bps = lender_profit_share_bps;
        config.min_collateral_ratio_bps = min_collateral_ratio_bps;
        config.liquidation_threshold_bps = liquidation_threshold_bps;
        config.min_credit_score = min_credit_score;
        config.bump = ctx.bumps.protocol_config;
        Ok(())
    }

    /// Borrower creates a vault with collateral deposit
    /// AI credit score and ZK proof hash are provided from off-chain computation
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        loan_amount: u64,
        collateral_amount: u64,
        credit_score: u8,
        risk_level: RiskLevel,
        zk_proof_hash: String,
        collateral_ratio_bps: u16,
    ) -> Result<()> {
        let config = &ctx.accounts.protocol_config;

        // Validate risk assessment results
        require!(
            collateral_ratio_bps >= config.min_collateral_ratio_bps,
            VaultError::InsufficientCollateralRatio
        );
        require!(
            credit_score >= config.min_credit_score,
            VaultError::CreditScoreTooLow
        );
        require!(!zk_proof_hash.is_empty(), VaultError::MissingZkProofHash);

        let approved = collateral_ratio_bps >= config.min_collateral_ratio_bps
            && credit_score >= config.min_credit_score;

        // Calculate interest due based on risk level
        let interest_rate_bps: u64 = match risk_level {
            RiskLevel::VeryLow | RiskLevel::Low => 1000, // 10%
            RiskLevel::Medium => 1600,                   // 16%
            _ => 2750,                                   // 27.5%
        };
        let interest_due = loan_amount
            .checked_mul(interest_rate_bps)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(10000)
            .ok_or(VaultError::MathOverflow)?;

        // Transfer collateral from borrower to vault token account
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.borrower_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, collateral_amount)?;

        // Initialize vault state
        let vault = &mut ctx.accounts.vault;
        vault.bump = ctx.bumps.vault;
        vault.borrower = ctx.accounts.borrower.key();
        vault.lender = Pubkey::default();
        vault.loan_amount = loan_amount;
        vault.collateral_amount = collateral_amount;
        vault.current_collateral = collateral_amount;
        vault.interest_due = interest_due;
        vault.lender_profit_locked = 0;
        vault.strategy_reinvest_pool = 0;
        vault.vault_nav = collateral_amount;
        vault.credit_score = credit_score;
        vault.risk_level = risk_level;
        vault.approved = approved;
        vault.status = VaultStatus::Pending;
        vault.zk_proof_hash = zk_proof_hash;
        vault.collateral_ratio_bps = collateral_ratio_bps;
        vault.created_at = Clock::get()?.unix_timestamp;
        vault.last_yield_at = 0;
        vault.cumulative_pnl = 0;
        vault.yield_rounds = 0;

        msg!("Vault initialized: loan={}, collateral={}, score={}, approved={}",
            loan_amount, collateral_amount, credit_score, approved);
        Ok(())
    }

    /// Lender funds the vault (deposits loan_amount into vault)
    pub fn fund_vault(ctx: Context<FundVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.status == VaultStatus::Pending, VaultError::InvalidVaultStatus);
        require!(vault.approved, VaultError::LoanNotApproved);

        // Transfer loan amount from lender to vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.lender_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.lender.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, vault.loan_amount)?;

        vault.lender = ctx.accounts.lender.key();
        vault.status = VaultStatus::Funded;
        vault.vault_nav = vault
            .vault_nav
            .checked_add(vault.loan_amount)
            .ok_or(VaultError::MathOverflow)?;

        msg!("Vault funded by lender: {}", ctx.accounts.lender.key());
        Ok(())
    }

    /// Simulate strategy yield (profit or loss)
    /// In production, this would be called by an authorized keeper/oracle
    /// pnl_amount is signed: positive = profit, negative = loss (passed as i64)
    pub fn simulate_yield(ctx: Context<SimulateYield>, pnl_amount: i64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let config = &ctx.accounts.protocol_config;

        require!(
            vault.status == VaultStatus::Funded || vault.status == VaultStatus::Strategy || vault.status == VaultStatus::Loss,
            VaultError::InvalidVaultStatus
        );

        vault.yield_rounds = vault.yield_rounds.checked_add(1).ok_or(VaultError::MathOverflow)?;
        vault.last_yield_at = Clock::get()?.unix_timestamp;
        vault.cumulative_pnl = vault.cumulative_pnl.checked_add(pnl_amount).ok_or(VaultError::MathOverflow)?;

        if pnl_amount >= 0 {
            let profit = pnl_amount as u64;

            // Calculate lender's share (e.g., 5% of profit)
            let lender_share = profit
                .checked_mul(config.lender_profit_share_bps as u64)
                .ok_or(VaultError::MathOverflow)?
                .checked_div(10000)
                .ok_or(VaultError::MathOverflow)?;

            // Cap lender share at remaining interest due
            let remaining_interest = vault
                .interest_due
                .saturating_sub(vault.lender_profit_locked);
            let actual_lender_share = lender_share.min(remaining_interest);
            let reinvest = profit.saturating_sub(actual_lender_share);

            vault.lender_profit_locked = vault
                .lender_profit_locked
                .checked_add(actual_lender_share)
                .ok_or(VaultError::MathOverflow)?;
            vault.strategy_reinvest_pool = vault
                .strategy_reinvest_pool
                .checked_add(reinvest)
                .ok_or(VaultError::MathOverflow)?;
            vault.vault_nav = vault
                .vault_nav
                .checked_add(profit)
                .ok_or(VaultError::MathOverflow)?;

            // Check if fully repaid
            let repayment_met = vault.lender_profit_locked >= vault.interest_due;
            let nav_sufficient = vault.vault_nav >= vault.loan_amount.checked_add(vault.lender_profit_locked).ok_or(VaultError::MathOverflow)?;

            if repayment_met && nav_sufficient {
                vault.status = VaultStatus::Repaid;
                msg!("Loan fully repaid! Lender profit locked: {}", vault.lender_profit_locked);
            } else {
                vault.status = VaultStatus::Strategy;
            }
        } else {
            let loss = (-pnl_amount) as u64;

            // Loss waterfall: first from strategy pool, then from collateral
            let strategy_absorbed = loss.min(vault.strategy_reinvest_pool);
            let collateral_loss = loss.saturating_sub(strategy_absorbed);

            vault.strategy_reinvest_pool = vault
                .strategy_reinvest_pool
                .saturating_sub(strategy_absorbed);
            vault.current_collateral = vault
                .current_collateral
                .saturating_sub(collateral_loss);
            vault.vault_nav = vault.vault_nav.saturating_sub(loss);

            // Check liquidation: vault_nav < loan_amount * liquidation_threshold / 10000
            let liquidation_line = vault
                .loan_amount
                .checked_mul(config.liquidation_threshold_bps as u64)
                .ok_or(VaultError::MathOverflow)?
                .checked_div(10000)
                .ok_or(VaultError::MathOverflow)?;

            if vault.vault_nav < liquidation_line {
                vault.status = VaultStatus::Liquidated;
                msg!("LIQUIDATION: vault_nav={} < threshold={}", vault.vault_nav, liquidation_line);
            } else {
                vault.status = VaultStatus::Loss;
            }
        }

        msg!("Yield simulated: pnl={}, nav={}, status={:?}",
            pnl_amount, vault.vault_nav, vault.status);
        Ok(())
    }

    /// Liquidate the vault (triggered when collateral ratio drops below threshold)
    /// Returns lender's principal (protected up to vault_nav)
    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            vault.status == VaultStatus::Liquidated,
            VaultError::InvalidVaultStatus
        );

        // Transfer remaining vault funds to lender (principal protection)
        let lender_recovery = vault.vault_nav.min(vault.loan_amount);
        let seeds = &[
            b"vault",
            vault.borrower.as_ref(),
            &vault.created_at.to_le_bytes(),
            &[vault.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        if lender_recovery > 0 {
            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.lender_token_account.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(transfer_ctx, lender_recovery)?;
        }

        msg!("Liquidation complete: lender recovered {}", lender_recovery);
        Ok(())
    }

    /// Withdraw after full repayment - borrower takes remaining vault funds
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.status == VaultStatus::Repaid, VaultError::LoanNotRepaid);
        require!(
            vault.borrower == ctx.accounts.borrower.key(),
            VaultError::UnauthorizedBorrower
        );

        let seeds = &[
            b"vault",
            vault.borrower.as_ref(),
            &vault.created_at.to_le_bytes(),
            &[vault.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer lender's principal + profit to lender
        let lender_total = vault
            .loan_amount
            .checked_add(vault.lender_profit_locked)
            .ok_or(VaultError::MathOverflow)?;

        let transfer_to_lender = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.lender_token_account.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_to_lender, lender_total)?;

        // Transfer remaining to borrower
        let borrower_amount = vault.vault_nav.saturating_sub(lender_total);
        if borrower_amount > 0 {
            let transfer_to_borrower = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.borrower_token_account.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(transfer_to_borrower, borrower_amount)?;
        }

        vault.status = VaultStatus::Withdrawn;
        msg!("Withdrawal complete: lender={}, borrower={}", lender_total, borrower_amount);
        Ok(())
    }

    /// Close vault and reclaim rent (after withdrawn or liquidated)
    pub fn close_vault(_ctx: Context<CloseVault>) -> Result<()> {
        msg!("Vault closed, rent reclaimed");
        Ok(())
    }
}

// ============================================================
// Account Contexts
// ============================================================

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [b"protocol_config"],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = borrower,
        space = 8 + CreditVault::INIT_SPACE,
        seeds = [b"vault", borrower.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, CreditVault>,

    /// CHECK: PDA authority for the vault token account
    #[account(
        seeds = [b"vault_authority", vault.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        seeds = [b"protocol_config"],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    /// Borrower's USDC token account
    #[account(mut, constraint = borrower_token_account.owner == borrower.key())]
    pub borrower_token_account: Account<'info, TokenAccount>,

    /// Vault's USDC token account (PDA-controlled)
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(
        mut,
        constraint = vault.status == VaultStatus::Pending @ VaultError::InvalidVaultStatus
    )]
    pub vault: Account<'info, CreditVault>,

    #[account(mut)]
    pub lender: Signer<'info>,

    /// Lender's USDC token account
    #[account(mut, constraint = lender_token_account.owner == lender.key())]
    pub lender_token_account: Account<'info, TokenAccount>,

    /// Vault's USDC token account
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SimulateYield<'info> {
    #[account(mut)]
    pub vault: Account<'info, CreditVault>,

    #[account(
        seeds = [b"protocol_config"],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// Authorized keeper/oracle (in production, verified via oracle or admin)
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(
        mut,
        constraint = vault.status == VaultStatus::Liquidated @ VaultError::InvalidVaultStatus
    )]
    pub vault: Account<'info, CreditVault>,

    /// CHECK: Vault PDA authority
    #[account(
        seeds = [b"vault_authority", vault.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    /// Vault's USDC token account
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Lender's USDC token account to receive recovered funds
    #[account(mut, constraint = lender_token_account.owner == vault.lender)]
    pub lender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        constraint = vault.status == VaultStatus::Repaid @ VaultError::LoanNotRepaid,
        constraint = vault.borrower == borrower.key() @ VaultError::UnauthorizedBorrower
    )]
    pub vault: Account<'info, CreditVault>,

    /// CHECK: Vault PDA authority
    #[account(
        seeds = [b"vault_authority", vault.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    /// Vault's USDC token account
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Borrower's USDC token account
    #[account(mut, constraint = borrower_token_account.owner == borrower.key())]
    pub borrower_token_account: Account<'info, TokenAccount>,

    /// Lender's USDC token account
    #[account(mut, constraint = lender_token_account.owner == vault.lender)]
    pub lender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        close = borrower,
        constraint = vault.status == VaultStatus::Withdrawn || vault.status == VaultStatus::Liquidated @ VaultError::InvalidVaultStatus,
        constraint = vault.borrower == borrower.key() @ VaultError::UnauthorizedBorrower
    )]
    pub vault: Account<'info, CreditVault>,

    #[account(mut)]
    pub borrower: Signer<'info>,
}
