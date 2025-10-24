export type TaskType = "transfer_token" | "migrate_token" | "migrate_wallet" | "deploy_token";

export interface TransferTokenTask {
	type: "transfer_token";
	tokenMint: string;
	amount: number;
	sourceWalletAddress: string; // source twin address
	targetWalletAddress: string; // target twin address
	sourceWalletPrivateKey: string; // source twin private key
}

export interface DeployTokenTask {
	type: "deploy_token";
	tokenMint: string; // real token address to deploy
	twinTokenMint: string; // twin token address to deploy
	twinTokenPrivateKey: string; // twin token private key
}

export interface MigrateTokenTask {
	type: "migrate_token";
	oldTokenMint: string; // old token twin address
	newTokenMint: string; // new token twin address
}

export interface MigrateWalletTask {
	type: "migrate_wallet";
	oldWalletAddress: string; // old wallet twin address
	newWalletAddress: string; // new wallet twin address
	oldWalletPrivateKey: string; // old wallet twin private key
}

export type Task = TransferTokenTask | MigrateTokenTask | MigrateWalletTask | DeployTokenTask;
