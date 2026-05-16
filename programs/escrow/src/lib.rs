pub mod instructions;
pub mod state;
pub mod constants;
pub use state::*;


use anchor_lang::prelude::*;

pub use instructions::*;
declare_id!("9r3zEmrVLWLHXpBasyGmZNTED1c5RZAEjj1N9ard24T4");


#[program]
pub mod escrow {
    use super::*;

    #[instruction(discriminator = 0)]
    pub fn make(ctx: Context<Make>, seed: u64, recieve: u64, deposit: u64) -> Result<()> {
        ctx.accounts.init_escrow(seed, recieve, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)?;

        Ok(())
    }

    #[instruction(discriminator = 1)]
    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.withdraw_and_close_vault()?;

        Ok(())
    }

    #[instruction(discriminator = 2)]
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()?;

        Ok(())
    }
}

