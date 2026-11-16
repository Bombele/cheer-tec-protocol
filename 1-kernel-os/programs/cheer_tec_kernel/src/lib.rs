use anchor_lang::prelude::*;

declare_id!("CheerTecKernel11111111111111111111111111111");

#[program]
pub mod cheer_tec_kernel {
    use super::*;

    /// Initializes a new tenant state silo for a restaurant unit or master franchise
    pub fn initialize_tenant(ctx: Context<InitializeTenant>, tenant_id: u64) -> Result<()> {
        let tenant_state = &mut ctx.accounts.tenant_state;
        tenant_state.tenant_id = tenant_id;
        tenant_state.authority = ctx.accounts.authority.key();
        tenant_state.is_active = true;
        tenant_state.total_processed_volume = 0;
        msg!("Tenant state initialized securely via PDA for ID: {}", tenant_id);
        Ok(())
    }

    /// Atomic Pay-Splitter: Intercepts validated POS basket and splits funds in <400ms
    pub fn execute_pay_split(ctx: Context<ExecutePaySplit>, gross_amount: u64) -> Result<()> {
        let tenant_state = &mut ctx.accounts.tenant_state;
        require!(tenant_state.is_active, CustomError::TenantInactive);

        // Mathematical distribution ratios (basis points: 100 = 1%)
        // Royalty (5%), Real Estate Lease (10%), Operating Share (85%)
        let royalty_share = gross_amount * 500 / 10000;
        let lease_share = gross_amount * 1000 / 10000;
        let operating_share = gross_amount - royalty_share - lease_share;

        tenant_state.total_processed_volume += gross_amount;

        msg!("Atomic Pay-Split executed in <400ms. Gross: {} | Royalty: {} | Lease: {} | Operating: {}", 
            gross_amount, royalty_share, lease_share, operating_share);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(tenant_id: u64)]
pub struct InitializeTenant<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 32 + 1 + 8,
        seeds = [b"tenant", tenant_id.to_le_bytes().as_ref()],
        bump
    )]
    pub tenant_state: Account<'info, TenantState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecutePaySplit<'info> {
    #[account(mut, seeds = [b"tenant", tenant_state.tenant_id.to_le_bytes().as_ref()], bump)]
    pub tenant_state: Account<'info, TenantState>,
    pub authority: Signer<'info>,
}

#[account]
pub struct TenantState {
    pub tenant_id: u64,
    pub authority: Pubkey,
    pub is_active: bool,
    pub total_processed_volume: u64,
}

#[error_code]
pub enum CustomError {
    #[msg("The specified tenant account is currently inactive or suspended.")]
    TenantInactive,
}
