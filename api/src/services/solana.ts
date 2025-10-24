import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
	getOrCreateAssociatedTokenAccount,
	createTransferInstruction,
	getAccount,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export async function sendTokenTransfer(
	fromPrivateKey: string,
	toAddress: string,
	tokenMint: string,
	amount: number
): Promise<string> {
	const fromKeypair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey));
	const toPublicKey = new PublicKey(toAddress);
	const mintPublicKey = new PublicKey(tokenMint);

	const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		fromKeypair,
		mintPublicKey,
		fromKeypair.publicKey
	);

	const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, mintPublicKey, toPublicKey);

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

	const signature = await connection.sendTransaction(transaction, [fromKeypair]);
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
	const privateKey = process.env.CENTRAL_WALLET_PRIVATE_KEY;
	if (!privateKey) {
		throw new Error("CENTRAL_WALLET_PRIVATE_KEY not configured");
	}
	return Keypair.fromSecretKey(bs58.decode(privateKey));
}

export function getCentralWalletAddress(): string {
	return getCentralWalletKeypair().publicKey.toBase58();
}
