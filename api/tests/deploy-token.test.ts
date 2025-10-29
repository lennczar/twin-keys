import { describe, test, expect, beforeAll } from "bun:test";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getMint } from "@solana/spl-token";
import dotenv from "dotenv";
import { getCentralWalletKeypair } from "../src/services/solana";
import { TEST_CONFIG, SHOULD_RUN_EXPENSIVE_TESTS } from "./test.config";

dotenv.config();

describe.skipIf(!SHOULD_RUN_EXPENSIVE_TESTS)("Token Deployment (Expensive)", () => {
	let connection: Connection;
	let payer: Keypair;
	const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

	beforeAll(async () => {
		connection = new Connection(SOLANA_RPC_URL, "confirmed");
		payer = getCentralWalletKeypair();

		// Check balance before running expensive tests
		const balance = await connection.getBalance(payer.publicKey);
		const balanceSOL = balance / LAMPORTS_PER_SOL;

		if (balanceSOL < TEST_CONFIG.balances.minTestDeploymentSOL) {
			throw new Error(
				`Insufficient balance for test (need at least ${TEST_CONFIG.balances.minTestDeploymentSOL} SOL, have ${balanceSOL} SOL)`
			);
		}
	});

	test("should create mint account with deterministic address", async () => {
		// Create a test mint keypair (32-byte seed like worker)
		const testSeed = new Uint8Array(32);
		crypto.getRandomValues(testSeed);
		const mintKeypair = Keypair.fromSeed(testSeed);

		const expectedAddress = mintKeypair.publicKey.toBase58();

		// Create mint
		const mintAddress = await createMint(
			connection,
			payer, // Payer
			mintKeypair.publicKey, // Mint authority
			null, // Freeze authority
			6, // Decimals
			mintKeypair // Pre-created keypair for deterministic address
		);

		// Verify mint was created with correct address
		expect(mintAddress.toBase58()).toBe(expectedAddress);

		// Verify mint info
		const mintInfo = await getMint(connection, mintAddress);
		expect(mintInfo.mintAuthority?.toBase58()).toBe(mintKeypair.publicKey.toBase58());
		expect(mintInfo.supply).toBe(0n);
		expect(mintInfo.decimals).toBe(6);
		expect(mintInfo.isInitialized).toBe(true);
	});

	test("should handle 32-byte seed keypairs correctly", () => {
		const testSeed = new Uint8Array(32);
		crypto.getRandomValues(testSeed);
		const mintKeypair = Keypair.fromSeed(testSeed);

		expect(mintKeypair.secretKey.length).toBe(64);
		expect(mintKeypair.publicKey).toBeDefined();
	});
});
