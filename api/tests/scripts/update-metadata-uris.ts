import dotenv from "dotenv";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { updateV1, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

/**
 * Fetches token metadata from Solana Token List (official registry used by Phantom and other wallets)
 */
async function fetchFromSolanaTokenList(tokenMint: string): Promise<{ name: string; symbol: string; logoURI: string } | null> {
	try {
		const response = await fetch("https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json");
		const data = await response.json() as { tokens: any[] };
		const token = data.tokens.find((t: any) => t.address === tokenMint);
		
		if (token && token.logoURI) {
			return { name: token.name, symbol: token.symbol, logoURI: token.logoURI };
		}
		return null;
	} catch (error) {
		console.error(`Failed to fetch from Solana Token List:`, error);
		return null;
	}
}

async function updateTokenMetadata(realTokenMint: string, twinTokenMint: string, twinPrivateKey: string) {
	console.log(`\n--- Updating metadata for twin ${twinTokenMint} ---`);
	console.log(`Real token: ${realTokenMint}`);

	try {
		const umi = createUmi(SOLANA_RPC_URL);
		
		// Fetch metadata from Solana Token List
		console.log("Fetching metadata from Solana Token List...");
		const registryMeta = await fetchFromSolanaTokenList(realTokenMint);
		
		if (!registryMeta || !registryMeta.logoURI) {
			console.log(`⚠️  No metadata with logoURI found in registry for ${realTokenMint}, skipping`);
			return;
		}

		console.log(`Found: ${registryMeta.name} (${registryMeta.symbol})`);
		console.log(`Logo URI: ${registryMeta.logoURI}`);
		
		// Setup signers
		const centralWalletKey = process.env.CENTRAL_WALLET_PRIVATE_KEY;
		if (!centralWalletKey) throw new Error("CENTRAL_WALLET_PRIVATE_KEY not set");
		
		// Central wallet is 32-byte seed (from Solana CLI export)
		const payerKeypair = Keypair.fromSeed(bs58.decode(centralWalletKey));
		
		// Twin tokens are also 32-byte seeds (from worker)
		const twinKeypair = Keypair.fromSeed(bs58.decode(twinPrivateKey));
		
		// Create UMI keypairs
		const payerUmiKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(payerKeypair.secretKey));
		const twinUmiKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(twinKeypair.secretKey));
		
		const payerSigner = createSignerFromKeypair(umi, payerUmiKeypair);
		const updateAuthoritySigner = createSignerFromKeypair(umi, twinUmiKeypair);
		umi.use(signerIdentity(payerSigner));

		// Update metadata with logoURI from registry
		const metadataPda = findMetadataPda(umi, { mint: publicKey(twinTokenMint) });
		
		console.log("Updating on-chain metadata...");
		await updateV1(umi, {
			mint: publicKey(twinTokenMint),
			authority: updateAuthoritySigner,
			data: {
				name: registryMeta.name,
				symbol: registryMeta.symbol,
				uri: registryMeta.logoURI, // Use logoURI from registry
				sellerFeeBasisPoints: 0,
				creators: null,
			},
		}).sendAndConfirm(umi);

		console.log(`✅ Metadata updated successfully`);
		console.log(`   Name: ${registryMeta.name}`);
		console.log(`   Symbol: ${registryMeta.symbol}`);
		console.log(`   URI: ${registryMeta.logoURI}`);

	} catch (error) {
		console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
	}
}

async function main() {
	console.log("=== Updating Twin Token Metadata from Solana Token List ===");

	// Get twin tokens from database
	const targets = await prisma.miningTarget.findMany({
		where: {
			type: "token",
			deployed: true,
			twinAddress: { not: null },
			twinPrivateKey: { not: null }
		}
	});

	console.log(`Found ${targets.length} deployed twin tokens`);

	for (const target of targets) {
		if (target.twinAddress && target.twinPrivateKey) {
			await updateTokenMetadata(
				target.address,
				target.twinAddress,
				target.twinPrivateKey
			);
		}
	}

	console.log("\n=== Complete ===");
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
