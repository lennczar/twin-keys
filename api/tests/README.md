# Test Suite Documentation

This directory contains comprehensive tests for the Twin Keys API, organized using Bun's built-in test runner (Jest-compatible).

## Test Organization

### Test Files

- **`solana.test.ts`** - Core Solana service tests
  - Central wallet configuration and balance checks
  - Worker keypair format validation
  - Token operations and RPC connectivity
  - Environment configuration validation

- **`metadata.test.ts`** - Token metadata fetching tests
  - Registry-first metadata fetching (Solana Token List)
  - Metaplex fallback for tokens not in registry
  - Twin token metadata verification
  - Metadata structure validation

- **`deployment-status.test.ts`** - Deployment state verification
  - Database state consistency
  - On-chain deployment verification
  - Twin token deployment checks (USDC, USDT)
  - Central wallet token balance verification

- **`deploy-token.test.ts`** - Expensive deployment tests (skipped by default)
  - Mint account creation with deterministic addresses
  - 32-byte seed keypair handling
  - ⚠️ **Costs SOL to run** - only runs with `RUN_EXPENSIVE_TESTS=true`

### Configuration

**`test.config.ts`** - Centralized test configuration

All test data is defined here to avoid hardcoding in tests:

```typescript
export const TEST_CONFIG = {
  tokens: {
    usdc: {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
    },
    usdt: { /* ... */ },
  },
  balances: {
    minCentralWalletSOL: 0.05,
    minTestDeploymentSOL: 0.02,
  },
  twinTokens: {
    usdc: "EP47stGT8UxauqLBZPY67zkeCtjrc6ttyfAHg91y7iMv",
    usdt: "EsoLvZvYvo84W3XmcLy4DP3fmNUXHfKdrwZzCCMfoHHB",
  },
};
```

**To add new test tokens:** Update `test.config.ts` instead of modifying individual test files.

### Utility Scripts

**`scripts/`** directory contains utility scripts (not tests):

- **`retry-deployments.ts`** - Manually retry failed token deployments
- **`update-metadata-uris.ts`** - Update twin token metadata from registry

Run these directly: `bun tests/scripts/retry-deployments.ts`

## Running Tests

### Basic Usage

```bash
# Run all tests (skips expensive tests)
bun test

# Run tests in watch mode
bun test:watch

# Run all tests including expensive ones (costs SOL)
bun test:expensive

# Run with coverage report
bun test:coverage
```

### Running Specific Tests

```bash
# Run specific test file
bun test solana.test.ts

# Run tests matching pattern
bun test --test-name-pattern "Central Wallet"

# Run tests in specific directory
bun test tests/
```

## Expensive Tests

Some tests cost SOL to run (e.g., creating mint accounts). These are **skipped by default** using Bun's `describe.skipIf()`.

To run expensive tests:

```bash
bun test:expensive
```

Or manually:

```bash
RUN_EXPENSIVE_TESTS=true bun test
```

Tests marked as expensive:
- `deploy-token.test.ts` - Mint account creation (~0.02 SOL per test)

## Environment Variables

Required for tests:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
CENTRAL_WALLET_PRIVATE_KEY=your_private_key
CENTRAL_WALLET_PUBLIC_KEY=your_public_key
DATABASE_URL=postgresql://...
```

Optional:

```bash
RUN_EXPENSIVE_TESTS=true  # Enable expensive tests
```

## Writing New Tests

### Use the Test Config

Always use `TEST_CONFIG` for test data:

```typescript
import { TEST_CONFIG } from "./test.config";

test("should fetch USDC", async () => {
  const metadata = await getTokenMetadata(TEST_CONFIG.tokens.usdc.address);
  expect(metadata.symbol).toBe(TEST_CONFIG.tokens.usdc.symbol);
});
```

### Mark Expensive Tests

If your test costs money (SOL), mark it as expensive:

```typescript
import { SHOULD_RUN_EXPENSIVE_TESTS } from "./test.config";

describe.skipIf(!SHOULD_RUN_EXPENSIVE_TESTS)("My Expensive Tests", () => {
  test("should create mint", async () => {
    // ... test that costs SOL
  });
});
```

### Test Structure

Use Bun's test runner syntax:

```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";

describe("My Feature", () => {
  beforeAll(() => {
    // Setup
  });

  test("should do something", () => {
    expect(result).toBe(expected);
  });

  afterAll(() => {
    // Cleanup
  });
});
```

## Test Coverage

Generate coverage reports:

```bash
bun test:coverage
```

Coverage reports show:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Continuous Integration

Tests are designed to run in CI environments:

```yaml
# Example CI config
- name: Run tests
  run: bun test

- name: Run expensive tests (optional)
  run: bun test:expensive
  if: github.event_name == 'release'
```

## Troubleshooting

### "Insufficient balance for test"

Expensive tests require SOL. Ensure central wallet has at least 0.02 SOL:

```bash
# Check balance
solana balance <CENTRAL_WALLET_ADDRESS>
```

### "Connection refused"

Check RPC URL in `.env`:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Tests failing with database errors

Ensure database is running and migrations are applied:

```bash
bun run prisma:migrate
```

## Best Practices

1. **Never hardcode test data** - Use `test.config.ts`
2. **Mark expensive tests** - Use `SHOULD_RUN_EXPENSIVE_TESTS` flag
3. **Clean up resources** - Use `afterAll()` for cleanup
4. **Test isolation** - Each test should be independent
5. **Descriptive names** - Use clear, descriptive test names
6. **Document assumptions** - Add comments for non-obvious behavior

## Support

For issues or questions about tests:
1. Check this README
2. Review test configuration in `test.config.ts`
3. Ensure environment variables are set correctly
4. Verify central wallet has sufficient balance

