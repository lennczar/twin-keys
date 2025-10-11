import { Helius } from "helius-sdk";
import { PublicKey } from "@solana/web3.js";
import prisma from "../db";

if (!process.env.HELIUS_API_KEY) {
	throw new Error("HELIUS_API_KEY is required");
}

const helius = new Helius(process.env.HELIUS_API_KEY);

export async function subscribeToWallet(walletAddress: string): Promise<number> {
	const subId = await helius.connection.onLogs(new PublicKey(walletAddress), async (logs) => {
		try {
			const tx = await helius.connection.getParsedTransaction(logs.signature, {
				maxSupportedTransactionVersion: 0,
			});
			if (!tx?.meta) return;

			const pre = tx.meta.preTokenBalances || [];
			const post = tx.meta.postTokenBalances || [];

			for (const postBalance of post) {
				if (postBalance.owner !== walletAddress || !postBalance.mint) continue;

				const preBalance = pre.find((p) => p.accountIndex === postBalance.accountIndex);
				const preAmount = preBalance ? Number(preBalance.uiTokenAmount.amount) : 0;
				const postAmount = Number(postBalance.uiTokenAmount.amount);
				const delta = postAmount - preAmount;

				if (delta !== 0) {
					console.log(JSON.stringify({ 
                        wallet: walletAddress,
                        token: postBalance.mint, 
                        postAmount,
                        preAmount,
                        delta,
                    }));
				}
			}
		} catch (error) {
			console.error("Error:", error);
		}
	});

	console.log(`✅ Subscribed to ${walletAddress} (ID: ${subId})`);
	return subId;
}

export async function unsubscribeById(subscriptionId: number): Promise<void> {
	await helius.connection.removeOnLogsListener(subscriptionId);
	console.log(`🔌 Unsubscribed (ID: ${subscriptionId})`);
}

export async function resubscribeActiveWallets() {
	try {
		const activeUsers = await prisma.user.findMany({
			where: { subId: { not: null }, wallet: { not: null } },
		});

		for (const user of activeUsers) {
			if (!user.wallet) continue;

			try {
				const newSubId = await subscribeToWallet(user.wallet);
				await prisma.user.update({
					where: { id: user.id },
					data: { subId: newSubId },
				});
			} catch (error) {
				console.error(`❌ Failed to resubscribe user ${user.id}:`, error);
			}
		}

		console.log(`✅ Resubscription complete`);
	} catch (error) {
		console.error("Error resubscribing active wallets:", error);
	}
}

