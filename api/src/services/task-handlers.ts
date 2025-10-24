import { PrismaClient } from "@prisma/client";
import { TransferTokenTask, MigrateTokenTask, MigrateWalletTask, DeployTokenTask } from "../types/tasks";
import { sendTokenTransfer, getCentralWalletAddress } from "./solana";
import { taskQueue } from "./task-queue";

const prisma = new PrismaClient();

export async function handleTransferToken(task: TransferTokenTask) {
	const { tokenMint, amount, sourceWalletAddress, targetWalletAddress, sourceWalletPrivateKey } = task;

	const signature = await sendTokenTransfer(sourceWalletPrivateKey, targetWalletAddress, tokenMint, amount);

	console.log(
		`Token transfer completed: ${sourceWalletAddress} -> ${targetWalletAddress} ${amount} of ${tokenMint} - ${signature}`
	);
}

export async function handleMigrateToken(task: MigrateTokenTask) {
	const { oldTokenMint, newTokenMint } = task;

    const twinTokenTarget = await prisma.miningTarget.findFirst({
        where: { twinAddress: newTokenMint },
    });

    if (!twinTokenTarget) {
        console.error(`Twin token target not found for new token twin: ${newTokenMint}`);
        return;
    }

    const twinTokenPrivateKey = twinTokenTarget.twinPrivateKey;
    
    taskQueue.dispatchTask({
        type: "deploy_token",
        tokenMint: oldTokenMint,
        twinTokenMint: newTokenMint,
        twinTokenPrivateKey: twinTokenPrivateKey!,
    });

	const realTokenTarget = await prisma.miningTarget.findFirst({
		where: { twinAddress: newTokenMint },
	});
	if (!realTokenTarget) {
		console.error(`Real token mint not found for new token twin: ${newTokenMint}`);
		return;
	}

	const realTokenMint = realTokenTarget.address;

	const holdingsWithRealToken = await prisma.tokenHoldings.findMany({
		where: { tokenMint: realTokenMint },
	});

	const centralWalletAddress = getCentralWalletAddress();

	for (const holding of holdingsWithRealToken) {
		const walletTarget = await prisma.miningTarget.findUnique({
			where: { address: holding.walletAddress },
		});

		if (!walletTarget?.twinAddress || !walletTarget?.twinPrivateKey) {
			console.warn(`Skipping wallet ${holding.walletAddress} - no twin wallet found`);
			continue;
		}

		taskQueue.dispatchTask({
			type: "transfer_token",
			tokenMint: oldTokenMint,
			amount: Number(holding.amount),
			sourceWalletAddress: walletTarget.twinAddress,
			targetWalletAddress: centralWalletAddress,
			sourceWalletPrivateKey: walletTarget.twinPrivateKey,
		});

		taskQueue.dispatchTask({
			type: "transfer_token",
			tokenMint: newTokenMint,
			amount: Number(holding.amount),
			sourceWalletAddress: centralWalletAddress,
			targetWalletAddress: walletTarget.twinAddress,
			sourceWalletPrivateKey: process.env.CENTRAL_WALLET_PRIVATE_KEY!,
		});
	}

	console.log(`Migrating token from ${oldTokenMint} to ${newTokenMint} for ${holdingsWithRealToken.length} wallets`);
}

export async function handleMigrateWallet(task: MigrateWalletTask) {
	const { oldWalletAddress, newWalletAddress, oldWalletPrivateKey } = task;

	const holdings = await prisma.tokenHoldings.findMany({
		where: { walletAddress: oldWalletAddress },
	});

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

	console.log(
		`Migrating wallet from ${oldWalletAddress} to ${newWalletAddress} - transferring ${holdings.length} tokens`
	);
}

export async function handleDeployToken(task: DeployTokenTask) {
	const { tokenMint, twinTokenMint, twinTokenPrivateKey } = task;

	const target = await prisma.miningTarget.findUnique({
		where: { address: tokenMint },
	});

	if (!target) {
		console.error(`Mining target not found for token: ${tokenMint}`);
		return;
	}

	if (target.deployed) {
		console.log(`Token ${tokenMint} already deployed, skipping deployment`);
		return;
	}

	console.log(`Deploying twin token contract for ${tokenMint}`);

	try {
		// TODO 1: fetch all metadata of the real (non twin) token contract. Name, symbol, decimals, etc.
		// TODO 2: deploy a twin token contract with the exact same metadata on the twinTokenMint with the twinTokenPrivateKey
		// TODO 3: allocate all tokens of this contract to the central wallet

		await prisma.miningTarget.update({
			where: { address: tokenMint },
			data: { deployed: true },
		});

		console.log(`✅ Successfully deployed twin token for ${tokenMint}`);
	} catch (error) {
		console.error(`❌ Failed to deploy twin token for ${tokenMint}:`, error);
		throw error;
	}
}
