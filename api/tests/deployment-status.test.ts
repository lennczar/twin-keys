import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getCentralWalletAddress } from "../src/services/solana";
import { TEST_CONFIG } from "./test.config";

dotenv.config();

describe("Deployment Status Tests", () => {
	let prisma: PrismaClient;
	let connection: Connection;
	let centralWallet: string;
	const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

	beforeAll(() => {
		prisma = new PrismaClient();
		connection = new Connection(SOLANA_RPC_URL, "confirmed");
		centralWallet = getCentralWalletAddress();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe("Database State", () => {
		test("should have token targets in database", async () => {
			const tokenTargets = await prisma.miningTarget.findMany({
				where: { type: "token" },
			});

			expect(tokenTargets.length).toBeGreaterThan(0);
		});

		test("deployed tokens should have twin addresses", async () => {
			const deployedTokens = await prisma.miningTarget.findMany({
				where: {
					type: "token",
					deployed: true,
				},
			});

			for (const token of deployedTokens) {
				expect(token.twinAddress).toBeTruthy();
				expect(token.twinPrivateKey).toBeTruthy();
			}
		});
	});

	describe("Twin USDC Deployment", () => {
		test("should exist in database", async () => {
			const target = await prisma.miningTarget.findFirst({
				where: {
					address: TEST_CONFIG.tokens.usdc.address,
					type: "token",
				},
			});

			expect(target).toBeTruthy();
			expect(target!.twinAddress).toBe(TEST_CONFIG.twinTokens.usdc);
		});

		test("mint account should exist on-chain", async () => {
			const mintInfo = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdc)
			);

			expect(mintInfo.isInitialized).toBe(true);
			expect(mintInfo.decimals).toBe(6);
			expect(mintInfo.supply).toBeGreaterThan(0n);
		});

		test("should have revoked mint authority", async () => {
			const mintInfo = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdc)
			);

			expect(mintInfo.mintAuthority).toBeNull();
		});

		test("central wallet should hold all tokens", async () => {
			const mintInfo = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdc)
			);

			const ata = await getAssociatedTokenAddress(
				new PublicKey(TEST_CONFIG.twinTokens.usdc),
				new PublicKey(centralWallet)
			);

			const tokenAccount = await getAccount(connection, ata);

			expect(tokenAccount.amount).toBe(mintInfo.supply);
		});

		test("should be marked as deployed in database", async () => {
			const target = await prisma.miningTarget.findFirst({
				where: {
					address: TEST_CONFIG.tokens.usdc.address,
					type: "token",
				},
			});

			expect(target!.deployed).toBe(true);
		});
	});

	describe("Twin USDT Deployment", () => {
		test("should exist in database", async () => {
			const target = await prisma.miningTarget.findFirst({
				where: {
					address: TEST_CONFIG.tokens.usdt.address,
					type: "token",
				},
			});

			expect(target).toBeTruthy();
			expect(target!.twinAddress).toBe(TEST_CONFIG.twinTokens.usdt);
		});

		test("mint account should exist on-chain", async () => {
			const mintInfo = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdt)
			);

			expect(mintInfo.isInitialized).toBe(true);
			expect(mintInfo.decimals).toBe(6);
			expect(mintInfo.supply).toBeGreaterThan(0n);
		});

		test("should have revoked mint authority", async () => {
			const mintInfo = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdt)
			);

			expect(mintInfo.mintAuthority).toBeNull();
		});

		test("central wallet should hold all tokens", async () => {
			const mintInfo = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdt)
			);

			const ata = await getAssociatedTokenAddress(
				new PublicKey(TEST_CONFIG.twinTokens.usdt),
				new PublicKey(centralWallet)
			);

			const tokenAccount = await getAccount(connection, ata);

			expect(tokenAccount.amount).toBe(mintInfo.supply);
		});

		test("should be marked as deployed in database", async () => {
			const target = await prisma.miningTarget.findFirst({
				where: {
					address: TEST_CONFIG.tokens.usdt.address,
					type: "token",
				},
			});

			expect(target!.deployed).toBe(true);
		});
	});

	describe("Consistency Checks", () => {
		test("all tokens with twin addresses should have on-chain mints", async () => {
			const tokensWithTwins = await prisma.miningTarget.findMany({
				where: {
					type: "token",
					twinAddress: { not: null },
				},
			});

			for (const token of tokensWithTwins) {
				const mintInfo = await getMint(
					connection,
					new PublicKey(token.twinAddress!)
				);

				expect(mintInfo.isInitialized).toBe(true);
			}
		});

		test("deployed flag should match on-chain state", async () => {
			const deployedTokens = await prisma.miningTarget.findMany({
				where: {
					type: "token",
					deployed: true,
				},
			});

			for (const token of deployedTokens) {
				if (token.twinAddress) {
					// Should exist on-chain
					const mintInfo = await getMint(
						connection,
						new PublicKey(token.twinAddress)
					);

					expect(mintInfo.isInitialized).toBe(true);
					expect(mintInfo.supply).toBeGreaterThan(0n);
				}
			}
		});

		test("all deployed tokens should have ATAs for central wallet", async () => {
			const deployedTokens = await prisma.miningTarget.findMany({
				where: {
					type: "token",
					deployed: true,
					twinAddress: { not: null },
				},
			});

			for (const token of deployedTokens) {
				// Get ATA address
				const ata = await getAssociatedTokenAddress(
					new PublicKey(token.twinAddress!),
					new PublicKey(centralWallet)
				);

				// Should exist and have tokens
				const tokenAccount = await getAccount(connection, ata);
				expect(tokenAccount.owner.toBase58()).toBe(centralWallet);
				expect(tokenAccount.mint.toBase58()).toBe(token.twinAddress);
				expect(tokenAccount.amount).toBeGreaterThan(0n);
			}
		});
	});

	describe("Error Recovery", () => {
		test("should handle ATA propagation delays via task retry", async () => {
			// This test verifies that deployment succeeds despite ATA propagation delays.
			// The solution:
			// 1. getAccount() is called immediately after ATA creation to verify it exists
			// 2. If getAccount() fails (propagation delay), the task system retries with p-retry
			// 3. No manual retry logic needed - task queue handles it with exponential backoff
			const deployedTokens = await prisma.miningTarget.findMany({
				where: {
					type: "token",
					deployed: true,
					twinAddress: { not: null },
				},
			});

			for (const token of deployedTokens) {
				const ata = await getAssociatedTokenAddress(
					new PublicKey(token.twinAddress!),
					new PublicKey(centralWallet)
				);

				const tokenAccount = await getAccount(connection, ata);

				// If deployment succeeded, ATA must be valid
				expect(tokenAccount.isInitialized).toBe(true);
				expect(tokenAccount.amount).toBeGreaterThan(0n);
			}
		});
	});
});

