/**
 * API Client for Twin Keys Backend
 * Base URL: http://localhost:3000
 */

const API_BASE_URL = "http://localhost:3000";

/**
 * Create a new user account
 * POST /users
 * Body: { email: string, wallet: string }
 * Returns: { id: string, email: string, wallet: string, ... }
 */
export async function createUser(email: string, wallet: string) {
	const response = await fetch(`${API_BASE_URL}/users`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, name:"",wallet }),
	});

	if (!response.ok) {
		throw new Error(`Failed to create user: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get all users (used for login - find user by wallet)
 * GET /users
 * Returns: Array<{ id: string, email: string, wallet: string, ... }>
 */
export async function getUsers() {
	const response = await fetch(`${API_BASE_URL}/users`);

	if (!response.ok) {
		throw new Error(`Failed to fetch users: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Activate user account and start mining process
 * POST /users/:userId/activate
 * Returns: { message: string, user: { id: string, subId: number, ... } }
 */
export async function activateUser(userId: string) {
	const response = await fetch(`${API_BASE_URL}/users/${userId}/activate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
	});

	if (!response.ok) {
		throw new Error(`Failed to activate user: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get mining target by address (wallet or token mint)
 * GET /mining/targets/:address
 * Returns: { 
 *   id: string, 
 *   address: string, 
 *   target: string,
 *   score: number,
 *   twinAddress: string | null,
 *   twinPrivateKey: string | null,
 *   type: "wallet" | "token",
 *   deployed: boolean
 * }
 */
export async function getMiningTargetByRealAddress(address: string) {
	const response = await fetch(`${API_BASE_URL}/mining/targets/real/${address}`);

	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error(`Failed to fetch mining target: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get mining target by twin address (twin wallet or twin token mint)
 * GET /mining/targets/twin/:address
 * Returns: { 
 *   id: string, 
 *   address: string, 
 *   target: string,
 *   score: number,
 *   twinAddress: string | null,
 *   twinPrivateKey: string | null,
 *   type: "wallet" | "token",
 *   deployed: boolean
 * }
 */
export async function getMiningTargetByTwinAddress(address: string) {
	const response = await fetch(`${API_BASE_URL}/mining/targets/twin/${address}`);

	if (!response.ok) {
		if (response.status === 404) {
			console.debug(`Mining target not found for twin address: ${address}`);
			return null;
		}
		console.error(`Failed to fetch mining target for ${address}: ${response.statusText}`);
		throw new Error(`Failed to fetch mining target: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get token holdings for a wallet from Solana on-chain
 * GET /tokenholdings/:wallet
 * Returns: Array<{
 *   mint: string,
 *   amount: string,
 *   decimals: number
 * }>
 */
export async function getTokenHoldings(wallet: string) {
	const response = await fetch(`${API_BASE_URL}/tokenholdings/${wallet}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch token holdings: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get token metadata from Metaplex
 * GET /tokenmetadata/:token
 * Returns: {
 *   name: string,
 *   symbol: string,
 *   uri: string,
 *   decimals: number,
 *   totalSupply: string
 * }
 */
export async function getTokenMetadata(tokenMint: string) {
	const response = await fetch(`${API_BASE_URL}/tokenmetadata/${tokenMint}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
	}

	return response.json();
}

