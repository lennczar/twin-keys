import { TransferTokenTask, MigrateTokenTask, MigrateWalletTask, DeployTokenTask } from "../types/tasks";
import { sendTokenTransfer, getCentralWalletAddress, getTokenMetadata, deployTwinToken, sendSOL, getSOLBalance, getTokenBalance, TWIN_WALLET_SOL_FUNDING } from "./solana";
import { taskQueue } from "./task-queue";
import { createLogger } from "../utils/logger";
import prisma from "../db";

const logger = createLogger("TASK_HANDLER");

// Keep a small amount for rent exemption
const RENT_RESERVE = 1_000_000; // 0.001 SOL

export async function handleTransferToken(task: TransferTokenTask) {
	const { tokenMint, amount, sourceWalletAddress, targetWalletAddress, sourceWalletPrivateKey } = task;

	logger.debug({ 
		tokenMint, 
		amount, 
		sourceWalletAddress, 
		targetWalletAddress 
	}, "Attempting token transfer");

	try {
		await sendTokenTransfer(sourceWalletPrivateKey, targetWalletAddress, tokenMint, amount);
		logger.debug({ tokenMint, amount, targetWalletAddress }, "Token transfer completed");
	} catch (error) {
		logger.error({ 
			error, 
			tokenMint, 
			amount, 
			sourceWalletAddress, 
			targetWalletAddress 
		}, "Token transfer failed");
		throw error;
	}
}

export async function handleMigrateToken(task: MigrateTokenTask) {
	const { oldTokenMint, newTokenMint } = task;

    const twinTokenTarget = await prisma.miningTarget.findFirst({
        where: { twinAddress: newTokenMint },
    });

    if (!twinTokenTarget) {
        logger.warn({ newTokenMint }, "Twin token target not found for new token twin");
        return;
    }

    const twinTokenPrivateKey = twinTokenTarget.twinPrivateKey;
    
    // Deploy the new token first
    taskQueue.dispatchTask({
        type: "deploy_token",
        tokenMint: twinTokenTarget.address,
        twinTokenMint: newTokenMint,
        twinTokenPrivateKey: twinTokenPrivateKey!,
    });

	// Wait for deployment to complete by checking the deployed flag
	// This ensures the token is fully deployed before attempting transfers
	logger.debug({ newTokenMint }, "Waiting for token deployment to complete");
	let deploymentComplete = false;
	let attempts = 0;
	while (!deploymentComplete && attempts < 60) { // Max 2 minutes
		await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
		const target = await prisma.miningTarget.findFirst({
			where: { address: twinTokenTarget.address },
		});
		deploymentComplete = target?.deployed || false;
		attempts++;
	}
	
	if (!deploymentComplete) {
		logger.error({ newTokenMint }, "Token deployment did not complete in time");
		return;
	}
	
	logger.debug({ newTokenMint }, "Token deployment confirmed, proceeding with transfers");

	// Use the twinTokenTarget we already found at the beginning
	const realTokenMint = twinTokenTarget.address;

	const holdingsWithRealToken = await prisma.tokenHoldings.findMany({
		where: { tokenMint: realTokenMint },
	});

	const centralWalletAddress = getCentralWalletAddress();

	for (const holding of holdingsWithRealToken) {
		const walletTarget = await prisma.miningTarget.findUnique({
			where: { address: holding.walletAddress },
		});

		if (!walletTarget?.twinAddress || !walletTarget?.twinPrivateKey) {
			logger.warn({ walletAddress: holding.walletAddress }, "Skipping wallet - no twin wallet found");
			continue;
		}

		// Fetch the actual balance of old tokens from the twin wallet
		const actualBalance = await getTokenBalance(walletTarget.twinAddress, oldTokenMint);
		const expectedAmount = Number(holding.amount);

		// Log a warning if the actual balance differs from what we expected
		if (actualBalance !== expectedAmount) {
			logger.warn({ 
				walletAddress: walletTarget.twinAddress,
				oldTokenMint,
				expectedAmount,
				actualBalance,
				difference: actualBalance - expectedAmount
			}, "Token balance mismatch - actual balance differs from TokenHoldings");
		}

		// Send ALL available old tokens to the central wallet (if any)
		if (actualBalance > 0) {
			taskQueue.dispatchTask({
				type: "transfer_token",
				tokenMint: oldTokenMint,
				amount: actualBalance,
				sourceWalletAddress: walletTarget.twinAddress,
				targetWalletAddress: centralWalletAddress,
				sourceWalletPrivateKey: walletTarget.twinPrivateKey,
			});
		}

		// Send new twin tokens in the amount given by TokenHoldings
		taskQueue.dispatchTask({
			type: "transfer_token",
			tokenMint: newTokenMint,
			amount: expectedAmount,
			sourceWalletAddress: centralWalletAddress,
			targetWalletAddress: walletTarget.twinAddress,
			sourceWalletPrivateKey: process.env.CENTRAL_WALLET_PRIVATE_KEY!,
		});
	}

	logger.info({ oldTokenMint, newTokenMint, walletCount: holdingsWithRealToken.length }, "Token migration initiated");
}

export async function handleMigrateWallet(task: MigrateWalletTask) {
	const { oldWalletAddress, newWalletAddress, oldWalletPrivateKey } = task;

	const holdings = await prisma.tokenHoldings.findMany({
		where: { walletAddress: oldWalletAddress },
	});

	// Transfer all tokens
	for (const holding of holdings) {
		taskQueue.dispatchTask({
			type: "transfer_token",
			tokenMint: holding.tokenMint,
			amount: Number(holding.amount),
			sourceWalletAddress: oldWalletAddress,
			targetWalletAddress: newWalletAddress,
			sourceWalletPrivateKey: oldWalletPrivateKey,
		});
	}

	// Transfer SOL balance from old to new twin wallet
	if (oldWalletPrivateKey) {
		try {
			const oldBalance = await getSOLBalance(oldWalletAddress);
			const transferAmount = oldBalance - RENT_RESERVE;
			
			if (transferAmount > 0) {
				await sendSOL(newWalletAddress, transferAmount, oldWalletPrivateKey);
				logger.info({ 
					oldWalletAddress, 
					newWalletAddress, 
					lamports: transferAmount 
				}, "Transferred SOL from old to new twin wallet");
			} else {
				logger.warn({ oldWalletAddress, balance: oldBalance }, "Old wallet has insufficient SOL to transfer");
			}
		} catch (error) {
			logger.error({ error, oldWalletAddress, newWalletAddress }, "Failed to transfer SOL between wallets");
		}
	}

	logger.info({ oldWalletAddress, newWalletAddress, tokenCount: holdings.length }, "Wallet migration initiated");
}

export async function handleDeployToken(task: DeployTokenTask) {
	const { tokenMint, twinTokenMint, twinTokenPrivateKey } = task;

	const target = await prisma.miningTarget.findUnique({
		where: { address: tokenMint },
	});

	if (!target) {
		logger.warn({ tokenMint }, "Mining target not found for token");
		return;
	}

	if (target.deployed) {
		logger.debug({ tokenMint }, "Token already deployed, skipping");
		return;
	}

	logger.debug({ tokenMint, twinTokenMint }, "Deploying twin token contract");

	try {
		// Step 1: Fetch metadata from the real token
		const metadata = await getTokenMetadata(tokenMint);

		// Step 2: Deploy twin token with same metadata and supply
		await deployTwinToken(twinTokenMint, twinTokenPrivateKey, metadata, metadata.totalSupply);

		// Step 3: Mark as deployed in database
		await prisma.miningTarget.update({
			where: { address: tokenMint },
			data: { deployed: true },
		});
	} catch (error) {
		logger.error({ error, tokenMint, twinTokenMint }, "Failed to deploy twin token");
		throw error;
	}
}
