import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { deployTwinToken, getTokenMetadata } from "../src/services/solana";

dotenv.config();

const prisma = new PrismaClient();

async function retryDeployments() {
	console.log("=== Retrying Failed Token Deployments ===\n");

	// Get all token targets that have twin addresses but aren't marked as deployed
	const targets = await prisma.miningTarget.findMany({
		where: {
			type: "token",
			twinAddress: { not: null },
			twinPrivateKey: { not: null },
			deployed: false
		}
	});

	console.log(`Found ${targets.length} tokens to retry\n`);

	for (const target of targets) {
		console.log(`\n--- Retrying: ${target.address.slice(0, 8)}...${target.address.slice(-8)} ---`);
		console.log(`Twin: ${target.twinAddress}`);

		try {
			// Fetch metadata from real token
			console.log("Fetching metadata...");
			const metadata = await getTokenMetadata(target.address);
			console.log(`Metadata: ${metadata.name} (${metadata.symbol})`);

			// Deploy twin token (with new resilient logic)
			console.log("Deploying twin token...");
			const signature = await deployTwinToken(
				target.twinAddress!,
				target.twinPrivateKey!,
				metadata,
				metadata.totalSupply
			);
			console.log(`✅ Deployment signature: ${signature}`);

			// Mark as deployed
			await prisma.miningTarget.update({
				where: { id: target.id },
				data: { deployed: true }
			});
			console.log(`✅ Marked as deployed in database`);

		} catch (error) {
			console.error(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	console.log("\n=== Retry Complete ===");
}

retryDeployments()
	.catch(console.error)
	.finally(() => prisma.$disconnect());

