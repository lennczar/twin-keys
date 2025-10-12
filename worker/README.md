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
2. Queries MiningTarget table for targets with score < 8
3. Spawns multiple threads (default: number of CPU cores)
4. Each thread generates Solana keypairs with unique nonce (thread_id + counter)
5. Calculates score by matching first 4 + last 4 characters
6. Checks current score before updating (prevents race conditions)
7. Updates database when better match found
8. Notifies API via POST /mining/discovery
9. Stops when all targets reach score 8

## Performance Optimizations

- No randomness - deterministic seed generation from thread_id + nonce
- Byte-wise string comparison instead of char iteration
- Race condition prevention with double-check before update
- SeaORM for efficient database access

## Configuration

- `DATABASE_URL`: PostgreSQL connection string
- `API_URL`: Twin Keys API base URL
- `NUM_THREADS`: Number of mining threads (default: CPU cores)
