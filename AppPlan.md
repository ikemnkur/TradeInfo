# TradeInfo App Plan (Game/Fundraiser Version)

## 1) Product Summary
TradeInfo is an offline-friendly social game where people collect and trade clue tokens (pieces or derivatives of a master key) to unlock a publicly downloadable encrypted file (example: RAR/7z/ZIP archive).

This is a collectible puzzle game and fundraiser, not a strict security product. Duplicate clues are expected and allowed.

---

## 2) Core Goals
- Let organizers create time-limited puzzle campaigns (example: 1 year).
- Let players acquire official clue tokens and trade them in person (paper/QR/verbal).
- Let players bid on recurring token drops (every X minutes) during campaign runtime.
- Let players fund in-app credits through verified on-chain deposits.
- Let players store tokens in a mobile app wallet.
- Let players verify whether a token is official.
- Let players compile valid tokens and attempt unlock.
- Reveal the final solution to everyone at campaign expiry.

---

## 3) Non-Goals
- Preventing copying of clue content.
- Preventing two users from owning the same clue.
- Providing bank-grade custody or secret protection.

---

## 4) Roles
- Organizer: creates campaign, uploads encrypted file metadata, issues clue tokens.
- Player: collects tokens, verifies tokens, trades offline, compiles attempts.
- Admin: content moderation, fraud handling, abuse response.

---

## 4.1) Account + Wallet Registration Rule
- Every player account must register one wallet per required chain:
  - ETH
  - BTC
  - SOL
  - LTC
- Wallet ownership is used as identity proof for payment attribution.
- Deposits are credited only when an on-chain transfer to the campaign treasury wallet is confirmed.

---

## 5) Campaign Lifecycle
1. Organizer creates campaign:
   - title, description, location/region, start/end dates.
   - encrypted file URL (public download link) + file hash.
   - unlock rule (example: at least 60 unique valid clues).
   - drop cadence (example: one token drop every 10 minutes).
   - auction rules (minimum bid, tie-break rule, bid window length).
2. System generates a master secret and token set.
3. System runs timed token drops:
   - a token is released into an auction round every X minutes.
   - highest bidder at round close wins claim rights.
4. Winner downloads the token (or claim code) and can print/share/trade it offline.
5. Players trade tokens online/offline.
6. Players submit compilation attempts in app.
7. On success, app reveals/derives unlock material.
8. At campaign expiry, full solution is released publicly.

---

## 6) Token Model (Clue Tokens)
Each token contains:
- token_id (unique ID)
- campaign_id
- clue_type:
  - direct_piece (literal substring)
  - transformed_piece (derived with known transform rules)
    - useful when direct pieces become widely known over time
  - hint_piece (position/index hint)
- clue_payload
- rarity_tier (common/rare/epic)
- drop_round_id (nullable if manually issued)
- acquisition_mode (auction_drop, fixed_price, donation_unlock, promo)
- issuer_signature (server signature proving token is official)
- issued_at

Important:
- Official tokens are verifiable by signature.
- Duplicate possession is allowed.
- Unique progress should normally count unique token_id values, not copy count.
- A token may be "market-known" over time; rarity and timing should influence value more than secrecy alone.

---

## 7) Unlock Logic
Use one clear rule for MVP:
- Rule: user must provide N unique valid token_ids, and each must pass signature verification for the campaign.

Optional advanced rule:
- Require specific categories (example: 10 direct + 30 transformed + 20 hint tokens).

On successful set:
- App compiles/derives unlock key candidate.
- User applies key to the public encrypted archive (RAR/7z/ZIP).

---

## 8) Wallet App Requirements (Player App)
The player app is essential.

Features:
- Import token via QR scan, typed code, or file.
- Offline local storage of collected tokens.
- Token authenticity check (signature verify, works offline with cached public key).
- Collection view:
  - total collected
  - unique valid count
  - duplicate count
  - progress toward unlock threshold
- Compile mode:
  - selects best valid unique set
  - builds unlock candidate
  - exports key text or copy button
- Bidding mode:
  - live drop countdown timer
  - place bid / increase bid
  - optional max auto-bid cap
  - round result and winning history
- Credits mode:
  - show available in-app credit balance
  - show pending deposit intents
  - show confirmed deposit history
- Sync mode (when online):
  - backup/restore collection
  - sync leaderboard/claim events
  - sync bid history and settled balances

Offline-first behavior:
- All scanning, storage, and verification must work without network.
- Server sync is eventually consistent once internet returns.
- Bidding requires network, but token storage/verification/trading still works offline.

---

## 9) Backend Services
1. Campaign Service
   - create/manage campaign
   - schedule expiry release
2. Token Issuance Service
   - generate token payloads
   - sign tokens with issuer private key
3. Drop/Auction Service
   - create scheduled rounds every X minutes
   - accept bids during active window
   - settle winner using deterministic tie-break rule
   - issue claim token/download entitlement
4. Payment Verification Service
   - create payment intents for selected chain/amount
   - expose treasury destination wallet per chain
   - verify transaction hash details against chain indexer/provider
   - enforce minimum confirmation thresholds before crediting
   - prevent duplicate tx crediting
5. Verification Service
   - publish campaign public keys and token schema
6. Player Sync Service
   - optional account auth
   - backup token inventory
   - track wallet/balance for bidding
7. Redemption/Attempt Service
   - validate submitted token sets
   - record successful unlock attempts

---

## 10) Suggested Data Model
Tables/collections:
- campaigns
- campaign_files (public URL, checksum/hash, archive type)
- tokens
- token_batches
- drop_rounds
- bids
- bid_settlements
- user_balances
- user_balance_ledger
- users
- user_wallets
- payment_intents
- payment_transactions
- user_token_claims
- unlock_attempts
- campaign_events

Key fields:
- campaigns.unlock_threshold
- campaigns.drop_interval_seconds
- campaigns.bid_window_seconds
- campaigns.min_bid
- campaigns.tie_break_rule (earliest_high_bid)
- campaigns.expiry_release_mode
- tokens.signature
- user_token_claims.source (qr_scan/manual/import/trade)
- bids.status (active, outbid, winning, refunded, settled)
- payment_intents.status (pending, awaiting_confirmations, underpaid, credited, rejected_wrong_destination)
- payment_transactions.tx_hash (unique per chain)
- user_wallets.chain + user_wallets.address (validated format)

---

## 11) API Sketch
- POST /campaigns
- GET /campaigns/:id
- POST /campaigns/:id/tokens/generate
- POST /users/register
- GET /users/:id
- GET /campaigns/:id/drops/current
- GET /campaigns/:id/drops/upcoming
- POST /payments/intents
- POST /payments/confirm
- GET /payments/intents/:intentId
- GET /users/:id/credits/ledger
- POST /drops/:roundId/bids
- POST /drops/:roundId/bids/auto-max
- GET /drops/:roundId/results
- POST /drops/:roundId/claim
- GET /campaigns/:id/public-config
- POST /tokens/verify
- POST /users/:id/claims
- POST /campaigns/:id/unlock-attempts
- GET /campaigns/:id/leaderboard
- POST /campaigns/:id/expire-release

---

## 12) Security and Trust Model
Because this is game-first:
- Guarantee token authenticity (official vs unofficial) with signatures.
- Do not promise clue secrecy after distribution.
- Protect organizer signing keys (HSM/KMS preferred).
- Publish transparency logs for issued token batches.

Content/legal:
- Organizer must confirm rights to content.
- Ban stolen/private/illegal data campaigns.

---

## 13) UX Rules
- Make duplicate handling explicit ("You already have this token_id").
- Show verified badge for official tokens.
- Show offline mode indicator.
- Show clear progress and missing requirements.
- Keep redemption steps simple and guided.
- For auctions, show:
  - countdown + round state
  - current high bid
  - user bid rank/status
  - clear settlement result (won/lost/refunded)
- For deposits, show:
  - exact treasury address by chain
  - required confirmation count
  - pending vs credited state
  - clear rejection reasons (wrong destination / underpaid / already used tx)

---

## 14) MVP Scope (8–12 weeks)
Phase 1:
- Campaign creation
- Token generation/signing
- QR card export
- Public campaign page with file hash and download link
- Basic timed drop scheduler

Phase 2:
- Mobile wallet app (scan, verify, store, progress, compile key)
- Offline-first local database
- Basic sync when online
- Simple highest-bid-wins round bidding
- Wallet registration + on-chain deposit intent flow

Phase 3:
- Unlock compile flow
- Expiry release automation:
  - remaining unissued tokens become free to download, or
  - full final key/solution is revealed at expiry
- Leaderboard + event log

---

## 15) Open Decisions to Finalize
1. Winning model:
   - Everyone who qualifies can unlock (recommended).
   - Optional first-solver badge for competition.
2. Progress counting:
   - unique token_id only (recommended)
3. Expiry behavior:
   - reveal full key (recommended for clean campaign closure)
4. Monetization:
   - Primary: recurring auction drops every X minutes
   - Optional:
     - donation unlocks (minimum contribution for token access)
     - subscription pass (fixed daily allocation, no bidding)
5. Anti-abuse level:
   - lightweight only (recommended for MVP)
6. Auction format:
   - English auction (visible high bid) for MVP
   - Sealed-bid can be a future upgrade
---

## 16) Recommended MVP Technical Stack
- Mobile app: Flutter or React Native
- Backend: Node.js + TypeScript (NestJS or Express)
- Database: PostgreSQL
- Offline storage: SQLite on device
- Crypto/signatures: Ed25519 for token signing and verification
- File hosting: S3-compatible object storage + CDN
- Chain data providers:
  - EVM indexer for ETH
  - BTC explorer API
  - SOL RPC/indexer
  - LTC explorer API

---

## 17) Success Criteria
- Players can trade token cards offline and later scan them.
- App verifies official tokens without internet.
- Players can track unlock progress in wallet app.
- Timed drops run reliably and winners are settled correctly.
- Deposit tx verification credits users correctly and rejects invalid submissions.
- Player can successfully compile and unlock the public archive, if they have sufficient keys (some keys are redundant).
- Campaign automatically reveals solution at expiry.