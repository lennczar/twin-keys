import { describe, test, expect, beforeAll } from "bun:test";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import bs58 from "bs58";
import dotenv from "dotenv";
import { getCentralWalletKeypair, getCentralWalletAddress } from "../src/services/solana";
import { TEST_CONFIG } from "./test.config";

dotenv.config();

describe("Solana Service Tests", () => {
	let connection: Connection;
	const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

	beforeAll(() => {
		connection = new Connection(SOLANA_RPC_URL, "confirmed");
	});

	describe("Central Wallet", () => {
		test("should derive correct address from private key", () => {
			const expectedAddress = process.env.CENTRAL_WALLET_PUBLIC_KEY;
			const centralKeypair = getCentralWalletKeypair();
			const derivedAddress = centralKeypair.publicKey.toBase58();

			expect(derivedAddress).toBe(expectedAddress);
		});

		test("should have sufficient balance", async () => {
			const centralKeypair = getCentralWalletKeypair();
			const balance = await connection.getBalance(centralKeypair.publicKey);
			const balanceSOL = balance / LAMPORTS_PER_SOL;

			expect(balanceSOL).toBeGreaterThan(TEST_CONFIG.balances.minCentralWalletSOL);
		});

		test("getCentralWalletAddress() should be consistent", () => {
			const address1 = getCentralWalletAddress();
			const address2 = getCentralWalletKeypair().publicKey.toBase58();

			expect(address1).toBe(address2);
		});
	});

	describe("Worker Keypair Format", () => {
		test("should create keypair from 32-byte seed", () => {
			// Simulate worker-generated 32-byte seed
			const testSeed32 = new Uint8Array(32);
			for (let i = 0; i < 32; i++) testSeed32[i] = i;
			const seedBase58 = bs58.encode(testSeed32);

			// This is how worker generates keypairs
			const keypair = Keypair.fromSeed(bs58.decode(seedBase58));

			expect(keypair.secretKey.length).toBe(64);
			expect(keypair.publicKey).toBeDefined();
		});
	});

	describe("Token Operations", () => {
		test("should fetch USDC mint info", async () => {
			const usdcMint = new PublicKey(TEST_CONFIG.tokens.usdc.address);
			const mintInfo = await getMint(connection, usdcMint);

			expect(mintInfo.decimals).toBe(TEST_CONFIG.tokens.usdc.decimals);
			expect(mintInfo.supply).toBeGreaterThan(0n);
			expect(mintInfo.isInitialized).toBe(true);
		});

		test("should fetch USDT mint info", async () => {
			const usdtMint = new PublicKey(TEST_CONFIG.tokens.usdt.address);
			const mintInfo = await getMint(connection, usdtMint);

			expect(mintInfo.decimals).toBe(TEST_CONFIG.tokens.usdt.decimals);
			expect(mintInfo.supply).toBeGreaterThan(0n);
			expect(mintInfo.isInitialized).toBe(true);
		});
	});

	describe("Keypair Signing Capability", () => {
		test("both mint and payer keypairs should have valid secret keys", () => {
			// Test mint keypair (32-byte seed like worker)
			const testSeed = new Uint8Array(32);
			crypto.getRandomValues(testSeed);
			const mintKeypair = Keypair.fromSeed(testSeed);

			// Test payer keypair (central wallet)
			const payerKeypair = getCentralWalletKeypair();

			expect(mintKeypair.secretKey.length).toBe(64);
			expect(payerKeypair.secretKey.length).toBe(64);
			expect(mintKeypair.publicKey).toBeDefined();
			expect(payerKeypair.publicKey).toBeDefined();
		});
	});

	describe("Network", () => {
		test("should connect to Solana RPC", async () => {
			const slot = await connection.getSlot();

			expect(slot).toBeGreaterThan(0);
		});
	});

	describe("Environment Configuration", () => {
		test("CENTRAL_WALLET_PRIVATE_KEY should be set", () => {
			const key = process.env.CENTRAL_WALLET_PRIVATE_KEY;

			expect(key).toBeDefined();
			expect(key!.length).toBeGreaterThan(0);
		});

		test("CENTRAL_WALLET_PUBLIC_KEY should be set", () => {
			const key = process.env.CENTRAL_WALLET_PUBLIC_KEY;

			expect(key).toBeDefined();
			expect(key!.length).toBeGreaterThan(0);
		});

		test("DATABASE_URL should be set", () => {
			const url = process.env.DATABASE_URL;

			expect(url).toBeDefined();
			expect(url!.length).toBeGreaterThan(0);
		});

		test("SOLANA_RPC_URL should be set", () => {
			const url = process.env.SOLANA_RPC_URL;

			expect(url).toBeDefined();
			expect(url!.length).toBeGreaterThan(0);
		});
	});
});
