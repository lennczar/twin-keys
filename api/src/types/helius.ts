// Helius webhook payload types
export interface HeliusWebhookPayload {
	signature: string;
	slot: number;
	timestamp: number;
	type?: string;
	events?: {
		tokenTransfers?: TokenTransfer[];
	};
	tokenTransfers?: TokenTransfer[];
}

export interface TokenTransfer {
	mint: string;
	amount: string | number;
	fromUserAccount: string;
	toUserAccount: string;
	decimals?: number;
}

export type TransferDirection = "IN" | "OUT" | "OTHER";

export interface ProcessedTransfer {
	direction: TransferDirection;
	mint: string;
	amountRaw: string | number;
	amount: number;
	from: string;
	to: string;
	signature: string;
	slot: number;
	timestamp: number;
}
