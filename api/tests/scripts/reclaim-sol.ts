/**
 * Recovery Script: Reclaim leaked SOL from twin wallets
 * 
 * This script collects all SOL from wallets stored in the recovery table
 * and sends it back to the central wallet.
 * 
 * Distinguishes wallets from token mints by checking balance:
 * - Wallets have >= 0.01 SOL (funded with 0.02 SOL)
 * - Token mints have 0 SOL
 * 
 * Usage: bun run tests/scripts/reclaim-sol.ts
 */

import { Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";
import prisma from "../../src/db";
import { getCentralWalletKeypair } from "../../src/services/solana";
import dotenv from "dotenv";

dotenv.config();

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC_URL, "finalized");
const RENT_RESERVE = 1_000_000; // Leave 0.001 SOL for rent exemption
const WALLET_THRESHOLD = 10_000_000; // 0.01 SOL - wallets are funded with 0.02 SOL

async function reclaimSOL() {
	console.log("=== Reclaiming SOL from Recovery Wallets ===\n");
	
	const centralWallet = getCentralWalletKeypair();
	console.log(`Central wallet: ${centralWallet.publicKey.toBase58()}\n`);
	
	// Get all recovery entries
	const recoveryEntries = await prisma.recovery.findMany();
	console.log(`Found ${recoveryEntries.length} entries in recovery table\n`);
	
	let totalReclaimed = 0;
	let successCount = 0;
	let skipCount = 0;
	let errorCount = 0;
	let tokenMintCount = 0;
	
	for (const entry of recoveryEntries) {
		try {
			const walletKeypair = Keypair.fromSeed(bs58.decode(entry.privateKey));
			const balance = await connection.getBalance(walletKeypair.publicKey);
			
			// Filter out token mints - they have 0 SOL, wallets have >= 0.01 SOL
			if (balance < WALLET_THRESHOLD) {
				if (balance === 0) {
					tokenMintCount++;
				} else {
					console.log(`⊘ ${entry.address}: ${(balance / 1e9).toFixed(6)} SOL (skipping - too low)`);
					skipCount++;
				}
				continue;
			}
			
			const transferAmount = balance - RENT_RESERVE;
			
			const transaction = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: walletKeypair.publicKey,
					toPubkey: centralWallet.publicKey,
					lamports: transferAmount,
				})
			);
			
			const signature = await connection.sendTransaction(transaction, [walletKeypair]);
			await connection.confirmTransaction(signature, "finalized");
			
			totalReclaimed += transferAmount;
			successCount++;
			console.log(`✓ ${entry.address}: ${(transferAmount / 1e9).toFixed(6)} SOL reclaimed (${signature.slice(0, 8)}...)`);
			
			// Small delay to avoid rate limiting
			await new Promise(resolve => setTimeout(resolve, 500));
		} catch (error) {
			errorCount++;
			console.error(`✗ ${entry.address}: Error - ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	
	console.log(`\n=== Summary ===`);
	console.log(`Total entries: ${recoveryEntries.length}`);
	console.log(`Token mints (filtered): ${tokenMintCount}`);
	console.log(`Successfully reclaimed: ${successCount}`);
	console.log(`Skipped (low balance): ${skipCount}`);
	console.log(`Errors: ${errorCount}`);
	console.log(`Total SOL reclaimed: ${(totalReclaimed / 1e9).toFixed(6)} SOL`);
}

reclaimSOL()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});

