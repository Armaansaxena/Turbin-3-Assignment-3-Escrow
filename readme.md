# Assignment 2 – Anchor Escrow (Turbin3 Pre-Builder)

This project is part of the Turbin3 Pre-Builder Assignment 2 focused on building a secure, trustless Escrow program on Solana using the Anchor framework.

## Tasks Completed

* Implemented a full-featured trustless escrow contract from scratch using modern Anchor idioms.
* Created a modular architecture by isolating individual instruction handlers into separate modules.
* Implemented secure token management, allowing Maker to lock token A to exchange for a specific amount of token B from Taker.
* Managed automated Cross-Program Invocations (CPI) with the Solana SPL Token Program for transfers and account authority manipulation.
* Handled full life-cycle instructions including initialization (`make`), execution (`take`), and cancellation (`refund`).
* Covered all core scenarios with a robust TypeScript integration test suite.

## Tech Stack

* Solana
* Anchor Framework
* Rust
* TypeScript
* @coral-xyz/anchor
* @solana/spl-token
* @solana/web3.js

## Project Structure

```text
.
├── programs/
│   └── anchor-escrow/
│       ├── Cargo.toml
│       ├── src/
│       │   ├── instructions/     # Decoupled escrow instruction handlers
│       │   │   ├── make.rs       # Initializes escrow and locks Maker's tokens
│       │   │   ├── refund.rs     # Cancels escrow and returns tokens to Maker
│       │   │   └── take.rs       # Executes trade, swaps assets, and closes state
│       │   ├── lib.rs            # Program entrypoint and routing
│       │   └── mod.rs            # Instruction module exports
│       └── tests/                # TypeScript integration test suite located alongside src
│           └── escrow.t.ts
├── Anchor.toml                  # Anchor configuration setup
└── README.md                    # Project documentation
└── README.md                    # Project documentation