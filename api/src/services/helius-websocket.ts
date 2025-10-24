import { Helius } from "helius-sdk";
import { PublicKey } from "@solana/web3.js";
import prisma from "../db";
import { taskQueue } from "./task-queue";
import { getCentralWalletAddress } from "./solana";

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

				await prisma.tokenHoldings.upsert({
					where: {
						walletAddress_tokenMint: {
							walletAddress: walletAddress,
							tokenMint: postBalance.mint,
						},
					},
					create: {
						walletAddress: walletAddress,
						tokenMint: postBalance.mint,
						amount: postBalance.uiTokenAmount.amount,
					},
					update: {
						amount: postBalance.uiTokenAmount.amount,
					},
				});

				if (delta !== 0) {
					console.log(
						JSON.stringify({
							wallet: walletAddress,
							token: postBalance.mint,
							postAmount,
							preAmount,
							delta,
						})
					);

					const target = await prisma.miningTarget.findUnique({
						where: { address: walletAddress },
					});

					await prisma.miningTarget.upsert({
						where: { address: postBalance.mint },
						create: {
							address: postBalance.mint,
							target: postBalance.mint.slice(0, 4) + postBalance.mint.slice(-4),
							type: "token",
						},
						update: {},
					});

					if (target?.twinAddress && target?.twinPrivateKey) {
						const centralWalletAddress = getCentralWalletAddress();

						const tokenTarget = await prisma.miningTarget.findUnique({
							where: { address: postBalance.mint },
						});

						if (!tokenTarget?.deployed && tokenTarget?.twinAddress && tokenTarget?.twinPrivateKey) {
							taskQueue.dispatchTask({
								type: "deploy_token",
								tokenMint: postBalance.mint,
								twinTokenMint: tokenTarget.twinAddress,
								twinTokenPrivateKey: tokenTarget.twinPrivateKey,
							});
						}

						if (tokenTarget?.deployed && tokenTarget?.twinAddress) {
							if (delta > 0) {
								taskQueue.dispatchTask({
									type: "transfer_token",
									tokenMint: tokenTarget.twinAddress,
									amount: delta,
									sourceWalletAddress: centralWalletAddress,
									targetWalletAddress: target.twinAddress,
									sourceWalletPrivateKey: process.env.CENTRAL_WALLET_PRIVATE_KEY!,
								});
							} else {
								taskQueue.dispatchTask({
									type: "transfer_token",
									tokenMint: tokenTarget.twinAddress,
									amount: Math.abs(delta),
									sourceWalletAddress: target.twinAddress,
									targetWalletAddress: centralWalletAddress,
									sourceWalletPrivateKey: target.twinPrivateKey,
								});
							}
						}
					}
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

export async function initializeTokenHoldings(walletAddress: string): Promise<void> {
	try {
		const publicKey = new PublicKey(walletAddress);
		const tokenAccounts = await helius.connection.getParsedTokenAccountsByOwner(publicKey, {
			programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
		});

		for (const account of tokenAccounts.value) {
			const tokenAmount = account.account.data.parsed.info.tokenAmount;
			const mint = account.account.data.parsed.info.mint;

			if (tokenAmount && mint) {
				await prisma.miningTarget.upsert({
					where: { address: mint },
					create: {
						address: mint,
						target: mint.slice(0, 4) + mint.slice(-4),
						type: "token",
					},
					update: {},
				});

				await prisma.tokenHoldings.upsert({
					where: {
						walletAddress_tokenMint: {
							walletAddress: walletAddress,
							tokenMint: mint,
						},
					},
					create: {
						walletAddress: walletAddress,
						tokenMint: mint,
						amount: tokenAmount.amount,
					},
					update: {
						amount: tokenAmount.amount,
					},
				});
			}
		}

		console.log(`✅ Initialized token holdings for ${walletAddress}`);
	} catch (error) {
		console.error(`❌ Failed to initialize token holdings for ${walletAddress}:`, error);
	}
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
