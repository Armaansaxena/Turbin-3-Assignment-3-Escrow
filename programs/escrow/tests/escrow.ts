import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../../../target/types/escrow";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { randomBytes } from "crypto";
import {ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID} from "@solana/spl-token"
import { create } from "domain";
import { SYSTEM_PROGRAM_ID } from "@anchor-lang/core/dist/cjs/native/system";
import { expect } from "chai";

const commitment = "confirmed";

describe("escrow", () => {

    const confirmTx = async (signature: string) => {
        const latestBlockhash = await anchor.getProvider().connection.getLatestBlockhash();
        await anchor.getProvider().connection.confirmTransaction(
            {
                signature,
                ...latestBlockhash,
            },
            commitment
        );
    };

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Escrow as Program<Escrow>;

    const connection = provider.connection;

    const payer = provider.wallet as NodeWallet;
    const taker = Keypair.generate();

    let mintA: PublicKey;
    let mintB: PublicKey;

    let makerAtaA: PublicKey;
    let makerAtaB: PublicKey;

    let takerAtaA: PublicKey;
    let takerAtaB: PublicKey;

    let vault: PublicKey;

    const seed = new BN(randomBytes(8));

    const escrow = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), payer.publicKey.toBuffer(), seed.toBuffer("le", 8)],
        program.programId
    )[0];

    it("Request airdrop to payer and taker", async () => {
        const sigs = await Promise.all([
            connection.requestAirdrop(payer.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL),
            connection.requestAirdrop(taker.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL),
        ]);
        await Promise.all(sigs.map(confirmTx));
    });

    it("Mint Tokens to Maker and Taker", async() => {
        mintA = await createMint(
            connection,
            payer.payer,
            provider.publicKey,
            provider.publicKey,
            6
        )
        console.log("Mint a", mintA.toBase58());

        mintB = await createMint(
            connection,
            payer.payer,
            provider.publicKey,
            provider.publicKey,
            6
        )

        console.log("Mint B", mintB.toBase58());

        vault = getAssociatedTokenAddressSync(mintA, escrow, true);

        makerAtaA = (await getOrCreateAssociatedTokenAccount(
            connection,
            payer.payer,
            mintA,
            provider.publicKey,
        )).address;

        makerAtaB = (await getOrCreateAssociatedTokenAccount(
            connection,
            payer.payer,
            mintB,
            provider.publicKey,
        )).address;

        takerAtaA = (await getOrCreateAssociatedTokenAccount(
            connection,
            payer.payer,
            mintA,
            taker.publicKey,
        )).address;

        takerAtaB = (await getOrCreateAssociatedTokenAccount(
            connection,
            payer.payer,
            mintB,
            taker.publicKey,
        )).address;

        // mint tokens
        await mintTo(
            connection,
            payer.payer,
            mintA,
            makerAtaA,
            payer.payer,
            1000_000_000
        );

        console.log("Minted 1000 tokens to makerAtaA", makerAtaA.toBase58());

        await mintTo(
            connection,
            payer.payer,
            mintB,
            takerAtaB,
            payer.payer,
            1000_000_000
        );

        console.log("Minted 1000 tokens to takerAtaB", takerAtaB.toBase58());
    })

    it("Make", async() => {

        const initialMakerAtaABalance = await provider.connection.getTokenAccountBalance(makerAtaA);
        console.log("Initial MakerAtaA balance: ", initialMakerAtaABalance.value.amount);

        const tx = await program.methods.make(
            seed,
            new BN(1_000_000),
            new BN(1_000_000),
        )
        .accountsStrict({
            maker: payer.publicKey,
            mintA: mintA,
            mintB: mintB,
            makerAtaA: makerAtaA,
            escrow: escrow,
            vault: vault,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SYSTEM_PROGRAM_ID,

        }).rpc();

        await confirmTx(tx);

        const finalVaultBalance = await provider.connection.getTokenAccountBalance(vault);
        console.log("Final vault balance: ", finalVaultBalance.value.amount);

        const finalMakerAtaABalance = await provider.connection.getTokenAccountBalance(vault);
        console.log("Final vault balance: ", finalMakerAtaABalance.value.amount);

        console.log("Make Tx: ", tx);
    })

    xit("Take", async() => {

        const tx = await program.methods.take(

        )
        .accountsStrict({
            taker: taker.publicKey,
            maker: payer.publicKey,
            mintA: mintA,
            mintB: mintB,
            escrow: escrow,
            takerAtaA: takerAtaA,
            takerAtaB: takerAtaB,
            makerAtaB: makerAtaB,
            vault: vault,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SYSTEM_PROGRAM_ID,


        })
        .signers([taker])
        .rpc();

        await confirmTx(tx);

        expect(await provider.connection.getBalance(vault)).to.equal(0);
        const vaultStateInfo = await provider.connection.getAccountInfo(vault);
        expect(vaultStateInfo).to.be.null;

        console.log("Make Tx: ", tx);
    })

    it("Refund", async() => {

        const tx = await program.methods.refund(

        )
        .accountsStrict({
            maker: payer.publicKey,
            mintA: mintA,
            makerAtaA: makerAtaA,
            escrow: escrow,
            vault: vault,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SYSTEM_PROGRAM_ID,

        })
        .rpc();

        await confirmTx(tx);

        expect(await provider.connection.getBalance(vault)).to.equal(0);
        const vaultStateInfo = await provider.connection.getAccountInfo(vault);
        expect(vaultStateInfo).to.be.null;

        console.log("Make Tx: ", tx);
    })

});