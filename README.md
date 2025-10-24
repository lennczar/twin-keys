# twin-keys

## Quick Setup

### Prerequisites
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE lennc;"
```

### API Setup
```bash
cd api
bun install
cp env.example .env  # Configure DATABASE_URL, HELIUS_API_KEY, CENTRAL_WALLET_PRIVATE_KEY, SOLANA_RPC_URL
bunx prisma migrate dev
bun run dev
```

### Worker Setup
```bash
cd worker
cp env.example .env  # Configure DATABASE_URL, API_URL
cargo run --release
```

## Usage

### Activate a Wallet
```bash
# 1. Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Test User","wallet":"YOUR_SOLANA_WALLET_ADDRESS"}'

# 2. Activate monitoring (replace USER_ID)
curl -X POST http://localhost:3000/users/USER_ID/activate

# 3. Deactivate monitoring (stops Helius webhook)
curl -X POST http://localhost:3000/users/USER_ID/deactivate
```

### Monitor Activity
- **API logs**: Token movements and task dispatches appear in the API console
- **Worker logs**: Mining discoveries and target updates in the worker console
- **Token transfers**: Look for JSON logs with `wallet`, `token`, `delta` fields