# Twin Keys System Flows

## Overview
The Twin Keys system creates and maintains "twin" wallets and token contracts that mirror real Solana wallets and tokens, using vanity addresses that closely match the originals.

---

## 1. User Wallet Activation Flow

**Trigger:** User calls activate endpoint with their wallet address

**Steps:**
1. User provides their real Solana wallet address
2. System subscribes to wallet via Helius WebSocket for real-time monitoring
3. System fetches all current token holdings for the wallet
4. System creates a mining target for the wallet (to find a matching twin address)
5. System adds all discovered tokens as mining targets
6. Subscription ID is stored in database for later management

**Result:** Wallet is now actively monitored for any token movements

---

## 2. Token Discovery Flow

**Trigger:** Token transaction detected on monitored wallet OR initial wallet scan

**Steps:**
1. System detects a token (either from transaction or initial holdings scan)
2. Token address is added to mining targets table with type "token"
3. Target is set to first 4 and last 4 characters of the token address
4. Workers will begin mining for a matching twin token address

**Result:** New token is registered and queued for twin address mining

---

## 3. Address Mining Flow

**Trigger:** Worker threads continuously running

**Steps:**
1. Workers fetch all active mining targets (score < 8)
2. Each worker thread generates candidate addresses using ed25519
3. For each candidate, calculate score by comparing first/last 4 characters
4. If score beats current best, attempt database update with race condition check
5. On successful update, worker retrieves old twin values from database
6. Worker notifies API with new twin address, private key, and old values
7. Database deployed flag is reset to false (requires redeployment)
8. If all targets reach score 8, workers idle and periodically recheck

**Result:** Better matching twin addresses are continuously discovered and stored

---

## 4. Twin Token Deployment Flow

**Trigger:** Token movement detected but twin token not yet deployed

**Steps:**
1. System checks if twin token has been deployed
2. If not deployed, dispatch deploy token task to queue
3. Task handler checks deployed flag again (prevent duplicate deployments)
4. System fetches metadata from real token (name, symbol, decimals)
5. New SPL token contract is deployed using twin address and private key
6. All initial token supply is allocated to central wallet
7. Database deployed flag is set to true

**Result:** Twin token contract exists on-chain, ready to mirror transactions

---

## 5. Token Transfer Synchronization Flow

**Trigger:** Token transaction detected on monitored wallet via Helius

**Steps:**
1. Helius sends transaction notification via WebSocket
2. System parses transaction for token balance changes
3. Token holdings table is updated with new balances
4. For each token with balance change (delta):
   - If token twin is deployed:
     - If delta > 0 (received): Transfer twin tokens from central wallet to twin wallet
     - If delta < 0 (sent): Transfer twin tokens from twin wallet to central wallet
   - If token twin not deployed: Dispatch deployment task first

**Result:** Twin wallet mirrors the real wallet's token balances

---

## 6. Token Migration Flow

**Trigger:** Mining worker finds better matching twin token address

**Steps:**
1. Worker reports discovery with new and old twin addresses
2. API dispatches migrate token task with old and new twin addresses
3. Task handler finds the real token address using the new twin address
4. System queries token holdings to find all wallets holding this real token
5. For each wallet with this token:
   - Find the corresponding twin wallet
   - Dispatch task: Transfer old twin tokens from twin wallet to central wallet
   - Dispatch task: Transfer new twin tokens from central wallet to twin wallet
6. Tasks execute with retry logic for blockchain operations

**Result:** All twin wallets now hold the better-matching twin token

---

## 7. Wallet Migration Flow

**Trigger:** Mining worker finds better matching twin wallet address

**Steps:**
1. Worker reports discovery with new and old twin wallet addresses
2. API dispatches migrate wallet task with old and new addresses
3. Task handler queries token holdings for the real wallet
4. For each token held by the real wallet:
   - Dispatch transfer task from old twin wallet to new twin wallet
5. All token transfers use the old twin wallet's private key as source
6. Tasks execute with retry logic for blockchain operations

**Result:** New twin wallet holds all tokens that were in old twin wallet

---

## 8. Task Queue Processing Flow

**Trigger:** Any task dispatched to event-driven queue

**Steps:**
1. Task is emitted as event and added to in-memory queue
2. Queue processor picks up task sequentially
3. Task handler executes with automatic retry logic:
   - 5 maximum attempts
   - Exponential backoff: 3s, 6s, 12s, 24s, 48s
   - Skip retry for non-retryable errors (invalid signature, insufficient funds)
4. Success: Log completion and move to next task
5. Failure after retries: Log error and move to next task

**Result:** Tasks are processed reliably with automatic failure handling

---

## 9. Wallet Deactivation Flow

**Trigger:** User calls deactivate endpoint

**Steps:**
1. User requests to stop monitoring their wallet
2. System unsubscribes from Helius WebSocket using stored subscription ID
3. Subscription ID is removed from database
4. Wallet is no longer monitored for transactions

**Result:** System stops mirroring transactions for this wallet

---

## 10. System Startup Flow

**Trigger:** API server starts

**Steps:**
1. Server initializes and connects to database
2. Task queue handlers are registered for all task types
3. System queries database for all users with active subscriptions
4. For each active user:
   - Resubscribe to their wallet via Helius WebSocket
   - Update subscription ID in database
5. Server begins accepting requests

**Result:** All previously active wallets are re-monitored after restart

---

## Key Design Principles

- **Event-Driven**: Tasks are dispatched as events, processed asynchronously
- **Idempotent**: Operations can be safely retried without side effects
- **Race-Safe**: Workers check current state before updating
- **Eventually Consistent**: Token balances converge to match real wallets
- **Fail-Safe**: Errors are logged but don't crash the system
- **Real-Time**: WebSocket monitoring provides instant transaction detection

