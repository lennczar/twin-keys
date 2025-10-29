import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
	getOrCreateAssociatedTokenAccount,
	createTransferInstruction,
	getAccount,
	TOKEN_PROGRAM_ID,
	getMint,
	createMint,
	mintTo,
	setAuthority,
	AuthorityType,
} from "@solana/spl-token";
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import {
	fetchMetadata,
	createMetadataAccountV3,
	findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import prisma from "../db";
import { createLogger } from "../utils/logger";

const logger = createLogger("SOLANA");
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Configure connection with aggressive rate limit handling
// Use "finalized" for stronger consistency guarantees (prevents TokenAccountNotFoundError due to propagation delays)
// Trade-off: slightly slower (~2-3s more latency per operation)
const connection = new Connection(SOLANA_RPC_URL, {
	commitment: "finalized",
	// Aggressive retry configuration for rate limits
	fetchMiddleware: (url, options, fetch) => {
		return retryWithExponentialBackoff(url, options, fetch);
	},
});

// Global exponential backoff wrapper for fetch calls
async function retryWithExponentialBackoff(
	url: string,
	options: any,
	fetch: typeof globalThis.fetch,
	maxRetries: number = 8,
	baseDelay: number = 500
): Promise<Response> {
	let lastError: Error | null = null;
	
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetch(url, options);
			
			// If we get a 429, retry with exponential backoff
			if (response.status === 429) {
				if (attempt === maxRetries) {
					logger.error({ url, attempts: attempt + 1 }, "Max retries reached for 429 rate limit");
					return response; // Return the 429 response so caller can handle it
				}
				
				// Exponential backoff: 500ms, 1s, 2s, 4s, 8s, 16s, 32s, 64s
				const delay = baseDelay * Math.pow(2, attempt);
				logger.warn({ attempt: attempt + 1, delay, url }, `Server responded with 429 Too Many Requests. Retrying after ${delay}ms delay...`);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}
			
			// For other responses, return immediately
			return response;
		} catch (error) {
			lastError = error as Error;
			
			// Network errors - retry with backoff
			if (attempt < maxRetries) {
				const delay = baseDelay * Math.pow(2, attempt);
				logger.warn({ attempt: attempt + 1, delay, error: lastError.message }, `Network error. Retrying after ${delay}ms delay...`);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}
		}
	}
	
	throw lastError || new Error("Max retries exceeded");
}

// SOL funding for twin wallets (~20 transactions worth)
export const TWIN_WALLET_SOL_FUNDING = 20_000_000; // 0.02 SOL

export async function sendTokenTransfer(
	fromPrivateKey: string,
	toAddress: string,
	tokenMint: string,
	amount: number,
	payerKeypair?: Keypair
): Promise<string> {
	// Private key from worker is 32-byte seed, use fromSeed instead of fromSecretKey
	const fromKeypair = Keypair.fromSeed(bs58.decode(fromPrivateKey));
	const payer = payerKeypair || getCentralWalletKeypair();
	const toPublicKey = new PublicKey(toAddress);
	const mintPublicKey = new PublicKey(tokenMint);

	const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		payer, // Payer creates/pays for account
		mintPublicKey,
		fromKeypair.publicKey
	);

	const toTokenAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		payer, // Payer creates/pays for account
		mintPublicKey,
		toPublicKey
	);

	// Check source account balance before attempting transfer
	const sourceBalance = Number(fromTokenAccount.amount);
	logger.debug({ 
		tokenMint, 
		sourceWallet: fromKeypair.publicKey.toBase58(),
		sourceBalance, 
		transferAmount: amount,
		targetWallet: toAddress
	}, "Preparing token transfer");

	if (sourceBalance < amount) {
		logger.error({ 
			tokenMint, 
			sourceWallet: fromKeypair.publicKey.toBase58(),
			sourceBalance, 
			transferAmount: amount 
		}, "Insufficient token balance for transfer");
		throw new Error(`Insufficient balance: ${sourceBalance} < ${amount}`);
	}

	const transaction = new Transaction().add(
		createTransferInstruction(
			fromTokenAccount.address,
			toTokenAccount.address,
			fromKeypair.publicKey,
			amount,
			[],
			TOKEN_PROGRAM_ID
		)
	);

	// Include both payer and fromKeypair as signers (deduplicate if same)
	const signers = payer.publicKey.equals(fromKeypair.publicKey)
		? [fromKeypair]
		: [payer, fromKeypair];

	const signature = await connection.sendTransaction(transaction, signers);
	await connection.confirmTransaction(signature, "confirmed");

	return signature;
}

export async function getTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
	const walletPublicKey = new PublicKey(walletAddress);
	const mintPublicKey = new PublicKey(tokenMint);

	try {
		const tokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			Keypair.generate(),
			mintPublicKey,
			walletPublicKey,
			true
		);

		const accountInfo = await getAccount(connection, tokenAccount.address);
		return Number(accountInfo.amount);
	} catch (error) {
		return 0;
	}
}

export function getCentralWalletKeypair(): Keypair {
	const secretKey = process.env.CENTRAL_WALLET_SECRET_KEY;
	if (!secretKey) {
		throw new Error("CENTRAL_WALLET_SECRET_KEY not configured");
	}
	return Keypair.fromSecretKey(bs58.decode(secretKey));
}

export function getCentralWalletAddress(): string {
	return getCentralWalletKeypair().publicKey.toBase58();
}

export async function sendSOL(
	toAddress: string,
	lamports: number,
	fromWalletPrivateKey?: string
): Promise<string> {
	const payer = getCentralWalletKeypair();
	const toPublicKey = new PublicKey(toAddress);

	// If fromWalletPrivateKey is provided, use that wallet as the sender
	// Central wallet always pays for gas (is the fee payer)
	const fromKeypair = fromWalletPrivateKey
		? Keypair.fromSeed(bs58.decode(fromWalletPrivateKey))
		: payer;

	const transaction = new Transaction().add(
		SystemProgram.transfer({
			fromPubkey: fromKeypair.publicKey,
			toPubkey: toPublicKey,
			lamports,
		})
	);

	// Include both payer and fromKeypair as signers (deduplicate if same)
	const signers = payer.publicKey.equals(fromKeypair.publicKey)
		? [payer]
		: [payer, fromKeypair];

	const signature = await connection.sendTransaction(transaction, signers);
	await connection.confirmTransaction(signature, "confirmed");

	return signature;
}

export async function getSOLBalance(walletAddress: string): Promise<number> {
	const publicKey = new PublicKey(walletAddress);
	return await connection.getBalance(publicKey);
}

export interface TokenMetadata {
	name: string;
	symbol: string;
	uri: string;
	decimals: number;
	totalSupply: bigint;
}

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
		logger.error({ error }, "Failed to fetch from Solana Token List");
		return null;
	}
}

export async function getTokenMetadata(tokenMint: string): Promise<TokenMetadata> {
	try {
		const mintPublicKey = new PublicKey(tokenMint);
		
		// 1. Try registry first
		const registryMeta = await fetchFromSolanaTokenList(tokenMint);
		
		let name: string, symbol: string, uri: string;
		
		if (registryMeta?.logoURI) {
			// Use registry data
			name = registryMeta.name;
			symbol = registryMeta.symbol;
			uri = registryMeta.logoURI;
			logger.info({ tokenMint }, "Using metadata from Solana Token List");
		} else {
			// Fall back to on-chain Metaplex metadata
			logger.info({ tokenMint }, "Token not in registry, fetching from Metaplex");
			const umi = createUmi(SOLANA_RPC_URL);
			const metadataPda = findMetadataPda(umi, { mint: publicKey(tokenMint) });
			const metadata = await fetchMetadata(umi, metadataPda);
			name = metadata.name;
			symbol = metadata.symbol;
			uri = metadata.uri;
		}
		
		// Always get decimals and supply from mint account
		const mintInfo = await getMint(connection, mintPublicKey);
		
		logger.debug({ name, symbol, decimals: mintInfo.decimals, supply: mintInfo.supply.toString() }, "Token metadata fetched");
		
		return { name, symbol, uri, decimals: mintInfo.decimals, totalSupply: mintInfo.supply };
	} catch (error) {
		logger.error({ error, tokenMint }, "Error fetching metadata for token");
		throw error;
	}
}

export async function deployTwinToken(
    twinTokenMint: string,
	twinTokenPrivateKey: string,
	metadata: TokenMetadata,
	totalSupply: bigint
): Promise<string> {
	try {
		const umi = createUmi(SOLANA_RPC_URL);
		const payer = getCentralWalletKeypair();
		// Private key from worker is 32-byte seed, use fromSeed instead of fromSecretKey
		const mintKeypair = Keypair.fromSeed(bs58.decode(twinTokenPrivateKey));

		logger.debug({ twinTokenMint, name: metadata.name, symbol: metadata.symbol }, "Deploying twin token");

		// Check if the address already exists (has SOL balance)
		// This prevents trying to create a mint at an already occupied address
		const existingBalance = await getSOLBalance(twinTokenMint);
		if (existingBalance > 0) {
			logger.info({ twinTokenMint, balance: existingBalance }, "Token address already exists, skipping deployment");
			return "already_exists";
		}

		// Write to recovery table
		await prisma.recovery.create({
			data: {
				address: twinTokenMint,
				privateKey: twinTokenPrivateKey,
			},
		}).catch(() => {}); // Ignore if already exists

		// Step 1: Create the mint account (skip if already exists)
		let mintExists = false;
		try {
			await getMint(connection, mintKeypair.publicKey);
			mintExists = true;
		} catch {
			// Mint doesn't exist, create it
			await createMint(
				connection,
				payer,
				mintKeypair.publicKey, // Mint authority (temporarily)
				null, // Freeze authority
				metadata.decimals,
				mintKeypair // Pre-created keypair for deterministic address
			);
			logger.debug({ twinTokenMint }, "Created mint account");
		}

		// Steps 2 & 3: Create metadata and ATA in parallel (both depend only on mint)
		// Setup UMI signers - need BOTH mint authority (twin) and payer (central)
		const payerSigner = createSignerFromKeypair(
			umi,
			umi.eddsa.createKeypairFromSecretKey(payer.secretKey)
		);
		const mintAuthoritySigner = createSignerFromKeypair(
			umi,
			umi.eddsa.createKeypairFromSecretKey(mintKeypair.secretKey)
		);
		umi.use(signerIdentity(payerSigner));

		const metadataPda = findMetadataPda(umi, { mint: publicKey(twinTokenMint) });

		// Check if metadata already exists
		let metadataExists = false;
		try {
			await fetchMetadata(umi, metadataPda);
			metadataExists = true;
		} catch {
			// Metadata doesn't exist, will create it
		}

		// Create metadata account (skip if exists)
		if (!metadataExists) {
			await createMetadataAccountV3(umi, {
				metadata: metadataPda,
				mint: publicKey(twinTokenMint),
				mintAuthority: mintAuthoritySigner, // Use mint keypair as authority
				payer: payerSigner, // Central wallet pays
				updateAuthority: mintAuthoritySigner,
				data: {
					name: metadata.name,
					symbol: metadata.symbol,
					uri: metadata.uri,
					sellerFeeBasisPoints: 0,
					creators: null,
					collection: null,
					uses: null,
				},
				isMutable: true,
				collectionDetails: null,
			}).sendAndConfirm(umi);
			logger.debug({ twinTokenMint }, "Created metadata account");
		}

		// Create ATA for central wallet
		let centralWalletATA;
		try {
			centralWalletATA = await getOrCreateAssociatedTokenAccount(
				connection,
				payer,
				mintKeypair.publicKey,
				payer.publicKey
			);
		} catch (error) {
			logger.error({ error, twinTokenMint }, "Error getting/creating ATA");
			throw error;
		}

		// Step 4: Mint total supply to central wallet (if not already minted)
		const currentMintInfo = await getMint(connection, mintKeypair.publicKey);
		
		if (currentMintInfo.supply === 0n) {
			const mintSignature = await mintTo(
				connection,
				payer,
				mintKeypair.publicKey,
				centralWalletATA.address,
				mintKeypair, // Current mint authority
				totalSupply
			);
			logger.debug({ twinTokenMint, totalSupply: totalSupply.toString(), signature: mintSignature }, "Minted tokens to central wallet");
		}

		// Step 5: Revoke mint authority (make supply fixed forever) if not already revoked
		const finalMintInfo = await getMint(connection, mintKeypair.publicKey);
		
		if (finalMintInfo.mintAuthority !== null) {
			const revokeSignature = await setAuthority(
				connection,
				payer,
				mintKeypair.publicKey,
				mintKeypair, // Current authority
				AuthorityType.MintTokens,
				null // Setting to null revokes authority
			);
			logger.debug({ twinTokenMint, signature: revokeSignature }, "Revoked mint authority");
			logger.info({ twinTokenMint, name: metadata.name, symbol: metadata.symbol }, "Twin token deployed successfully");
			return revokeSignature;
		} else {
			logger.info({ twinTokenMint, name: metadata.name, symbol: metadata.symbol }, "Twin token deployed successfully");
			return "already_deployed";
		}
	} catch (error) {
		logger.error({ error, twinTokenMint }, "Error deploying twin token");
		throw error;
	}
}
