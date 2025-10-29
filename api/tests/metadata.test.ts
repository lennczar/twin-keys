import { describe, test, expect, beforeAll } from "bun:test";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { fetchMetadata, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata";
import dotenv from "dotenv";
import { getTokenMetadata } from "../src/services/solana";
import { TEST_CONFIG } from "./test.config";

dotenv.config();

describe("Token Metadata Tests", () => {
	let connection: Connection;
	const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

	beforeAll(() => {
		connection = new Connection(SOLANA_RPC_URL, "confirmed");
	});

	describe("Registry-First Metadata Fetching", () => {
		test("should fetch USDC metadata from Solana Token List", async () => {
			const metadata = await getTokenMetadata(TEST_CONFIG.tokens.usdc.address);

			expect(metadata.name).toBe(TEST_CONFIG.tokens.usdc.name);
			expect(metadata.symbol).toBe(TEST_CONFIG.tokens.usdc.symbol);
			expect(metadata.decimals).toBe(TEST_CONFIG.tokens.usdc.decimals);
			expect(metadata.uri).toBeTruthy(); // Should have a URI from registry
			expect(metadata.uri).toContain("githubusercontent.com"); // Logo from GitHub
			expect(metadata.totalSupply).toBeGreaterThan(0n);
		});

		test("should fetch USDT metadata from Solana Token List", async () => {
			const metadata = await getTokenMetadata(TEST_CONFIG.tokens.usdt.address);

			expect(metadata.name).toBe(TEST_CONFIG.tokens.usdt.name);
			expect(metadata.symbol).toBe(TEST_CONFIG.tokens.usdt.symbol);
			expect(metadata.decimals).toBe(TEST_CONFIG.tokens.usdt.decimals);
			expect(metadata.uri).toBeTruthy(); // Should have a URI from registry
			expect(metadata.uri).toContain("githubusercontent.com"); // Logo from GitHub
			expect(metadata.totalSupply).toBeGreaterThan(0n);
		});
	});

	describe("Metaplex Fallback", () => {
		test("should fall back to Metaplex for twin USDC (not in registry)", async () => {
			const metadata = await getTokenMetadata(TEST_CONFIG.twinTokens.usdc);

			// Should have metadata even though not in registry
			expect(metadata.name).toBeTruthy();
			expect(metadata.symbol).toBeTruthy();
			expect(metadata.decimals).toBe(6);
			expect(metadata.totalSupply).toBeGreaterThan(0n);
		});

		test("should fall back to Metaplex for twin USDT (not in registry)", async () => {
			const metadata = await getTokenMetadata(TEST_CONFIG.twinTokens.usdt);

			// Should have metadata even though not in registry
			expect(metadata.name).toBeTruthy();
			expect(metadata.symbol).toBeTruthy();
			expect(metadata.decimals).toBe(6);
			expect(metadata.totalSupply).toBeGreaterThan(0n);
		});
	});

	describe("Twin Token Metadata Verification", () => {
		test("twin USDC should have updated metadata URI", async () => {
			const umi = createUmi(SOLANA_RPC_URL);
			const metadataPda = findMetadataPda(umi, {
				mint: publicKey(TEST_CONFIG.twinTokens.usdc),
			});

			const metadata = await fetchMetadata(umi, metadataPda);

			expect(metadata.name).toBeTruthy();
			expect(metadata.symbol).toBe("USDC");
			expect(metadata.uri).toBeTruthy();
		});

		test("twin USDT should have updated metadata URI", async () => {
			const umi = createUmi(SOLANA_RPC_URL);
			const metadataPda = findMetadataPda(umi, {
				mint: publicKey(TEST_CONFIG.twinTokens.usdt),
			});

			const metadata = await fetchMetadata(umi, metadataPda);

			expect(metadata.name).toBeTruthy();
			expect(metadata.symbol).toBe("USDT");
			expect(metadata.uri).toBeTruthy();
		});

		test("twin tokens should have revoked mint authority", async () => {
			const usdcMint = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdc)
			);
			const usdtMint = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdt)
			);

			expect(usdcMint.mintAuthority).toBeNull();
			expect(usdtMint.mintAuthority).toBeNull();
		});

		test("twin tokens should have correct supply", async () => {
			const usdcMint = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdc)
			);
			const usdtMint = await getMint(
				connection,
				new PublicKey(TEST_CONFIG.twinTokens.usdt)
			);

			expect(usdcMint.supply).toBeGreaterThan(0n);
			expect(usdtMint.supply).toBeGreaterThan(0n);
		});
	});

	describe("Metadata Structure Validation", () => {
		test("metadata should include all required fields", async () => {
			const metadata = await getTokenMetadata(TEST_CONFIG.tokens.usdc.address);

			expect(metadata).toHaveProperty("name");
			expect(metadata).toHaveProperty("symbol");
			expect(metadata).toHaveProperty("uri");
			expect(metadata).toHaveProperty("decimals");
			expect(metadata).toHaveProperty("totalSupply");

			expect(typeof metadata.name).toBe("string");
			expect(typeof metadata.symbol).toBe("string");
			expect(typeof metadata.uri).toBe("string");
			expect(typeof metadata.decimals).toBe("number");
			expect(typeof metadata.totalSupply).toBe("bigint");
		});
	});
});

