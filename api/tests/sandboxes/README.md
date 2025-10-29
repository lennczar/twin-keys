# Test Sandboxes

This directory contains isolated sandbox scripts for debugging specific issues.

## Purpose

Sandboxes are used to:
- Reproduce errors in isolation
- Test specific scenarios without affecting production code
- Experiment with potential solutions
- Document edge cases and timing issues

## Current Sandboxes

### `ata-propagation-test.ts`

**Issue:** `TokenAccountNotFoundError` when using newly created ATAs

**What it does:**
- Creates a test token mint
- Tests various scenarios of ATA creation and immediate usage
- Attempts to reproduce the propagation delay issue
- Inspects what `getOrCreateAssociatedTokenAccount` actually returns

**Run it:**
```bash
bun tests/sandboxes/ata-propagation-test.ts
```

**Expected outcomes:**
- If test case fails immediately: Confirms propagation delay issue
- If test case succeeds after wait: Confirms timing-related problem
- Provides data on RPC node behavior

## Adding New Sandboxes

When creating a new sandbox:

1. Name it descriptively: `<issue>-<test>.ts`
2. Add documentation at the top explaining:
   - What issue you're investigating
   - What the sandbox does
   - How to run it
3. Make it self-contained (can use functions from codebase via imports)
4. Update this README with the new sandbox

## Notes

- Sandboxes may cost SOL to run (e.g., creating test tokens)
- They are NOT part of the regular test suite
- Run manually when debugging specific issues
- Clean up any test tokens/accounts after investigation if needed

