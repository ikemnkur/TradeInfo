# TradeInfo Mock App

Simple mock app with visitable routes and lightweight backend wiring.

## 1) Setup

```bash
npm install
cp .env.mock .env
npm start
```

App runs at `http://localhost:3000` by default.

## 2) Main Visitable Routes

- `/`
- `/campaigns`
- `/campaigns/new`
- `/campaigns/:id`
- `/campaigns/:id/drops/current`
- `/campaigns/:id/drops/upcoming`
- `/drops/:roundId`
- `/wallet`
- `/wallet/collection`
- `/wallet/compile`
- `/wallet/credits`
- `/account/register`
- `/payments/deposit`
- `/leaderboard`
- `/admin`

## 3) Mock API Routes

- `GET /api/health`
- `GET /api/config`
- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `POST /api/users/register`
- `GET /api/users/:id`
- `POST /api/payments/intents`
- `POST /api/payments/confirm`
- `GET /api/payments/intents/:intentId`
- `GET /api/users/:id/credits/ledger`
- `POST /api/drops/:roundId/bids`
- `POST /api/campaigns/:id/unlock-attempts`

### Payment + Credits mock flow

1. Register user with required wallets (`ETH`, `BTC`, `SOL`, `LTC`).
2. Create deposit intent (`/api/payments/intents`) to get chain destination and required confirmations.
3. Submit tx proof (`/api/payments/confirm`) with `txHash`, destination wallet, amount, and confirmations.
4. On valid confirmation, credits are awarded and available for bidding.

## 4) Env Defaults

All default settings are in `.env.mock`, including:
- campaign timing
- unlock threshold
- drop cadence + bidding defaults
- placeholder crypto integration fields for your old app
- wallet requirements, treasury addresses, and chain confirmation defaults
