# Twin Keys Miner

Rust worker service that mines vanity Solana addresses matching targets in the MiningTarget table.

## Setup

1. **Copy environment file:**
   ```bash
   cd worker
   cp env.example .env
   ```

2. **Build the worker:**
   ```bash
   cargo build --release
   ```

## Running

```bash
cargo run --release
```

Or with custom thread count:
```bash
NUM_THREADS=16 cargo run --release
```

## How It Works

1. Connects to PostgreSQL via SeaORM
2. Queries MiningTarget table for targets with score < MAX_SCORE
3. If no targets found, idles for 30 seconds then re-checks
4. Spawns multiple threads (default: number of CPU cores)
5. Each thread generates Solana keypairs with unique nonce (thread_id + counter)
6. Calculates score by matching first 4 + last 4 characters
7. Checks current score before updating (prevents race conditions)
8. Updates database when better match found
9. Notifies API via POST /mining/discovery
10. Returns to step 2 (continuously monitors for new targets)

## Performance Optimizations

- No randomness - deterministic seed generation from thread_id + nonce
- Byte-wise string comparison instead of char iteration
- Race condition prevention with double-check before update
- SeaORM for efficient database access

## Configuration

- `DATABASE_URL`: PostgreSQL connection string
- `API_URL`: Twin Keys API base URL
- `NUM_THREADS`: Number of mining threads (default: CPU cores)
- `IDLE_CHECK_INTERVAL_SECS`: Seconds to wait when all targets complete (default: 30, set in code)



## MEXT STEPS (note for me)

- actually create tasks / rows in the mining target table
-> upon wallet creation mine for twin wallet
-> upon receiving new tokens mine for twin tokens