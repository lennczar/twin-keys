export const TEST_CONFIG = {
	// Known good token addresses for testing
	tokens: {
		usdc: {
			address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
			name: "USD Coin",
			symbol: "USDC",
			decimals: 6,
		},
		usdt: {
			address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
			name: "USDT",
			symbol: "USDT",
			decimals: 6,
		},
	},
	// Minimum balance requirements
	balances: {
		minCentralWalletSOL: 0.05,
		minTestDeploymentSOL: 0.02,
	},
	// Twin tokens (from database, for metadata tests)
	twinTokens: {
		usdc: "EP47stGT8UxauqLBZPY67zkeCtjrc6ttyfAHg91y7iMv",
		usdt: "EsoLvZvYvo84W3XmcLy4DP3fmNUXHfKdrwZzCCMfoHHB",
	},
};

// Flag to check if expensive tests should run
export const SHOULD_RUN_EXPENSIVE_TESTS = process.env.RUN_EXPENSIVE_TESTS === "true";

