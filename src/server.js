const path = require("path");
const crypto = require("crypto");
const express = require("express");
const dotenv = require("dotenv");
const { campaigns, dropRounds, users } = require("./mockData");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
app.use(express.json());

const config = {
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  defaultDurationDays: Number(process.env.CAMPAIGN_DEFAULT_DURATION_DAYS || 365),
  unlockThreshold: Number(process.env.CAMPAIGN_UNLOCK_THRESHOLD || 60),
  dropIntervalMinutes: Number(process.env.DROP_INTERVAL_MINUTES || 10),
  bidWindowSeconds: Number(process.env.BID_WINDOW_SECONDS || 120),
  minBid: Number(process.env.MIN_BID || 1),
  tieBreakRule: process.env.TIE_BREAK_RULE || "earliest_high_bid",
  cryptoProvider: process.env.CRYPTO_PROVIDER || "legacy_app",
  cryptoApiBaseUrl: process.env.CRYPTO_API_BASE_URL || "http://localhost:4000",
  depositCreditsPerUsd: Number(process.env.DEPOSIT_CREDITS_PER_USD || 10),
  requiredWalletChains: (process.env.REQUIRED_WALLET_CHAINS || "ETH,BTC,SOL,LTC")
    .split(",")
    .map((chain) => chain.trim().toUpperCase())
    .filter(Boolean),
  requiredChainConfirmations: {
    ETH: Number(process.env.ETH_REQUIRED_CONFIRMATIONS || 12),
    BTC: Number(process.env.BTC_REQUIRED_CONFIRMATIONS || 2),
    SOL: Number(process.env.SOL_REQUIRED_CONFIRMATIONS || 32),
    LTC: Number(process.env.LTC_REQUIRED_CONFIRMATIONS || 6)
  },
  treasuryWallets: {
    ETH: process.env.TREASURY_WALLET_ETH || "0x000000000000000000000000000000000000dEaD",
    BTC: process.env.TREASURY_WALLET_BTC || "bc1qtradeinfotreasury0000000000000000000000",
    SOL: process.env.TREASURY_WALLET_SOL || "TradeInfoTreasury111111111111111111111111111111",
    LTC: process.env.TREASURY_WALLET_LTC || "ltc1qtradeinfotreasury0000000000000000000000"
  }
};

const supportedChains = ["ETH", "BTC", "SOL", "LTC"];

const paymentIntents = [];
const paymentTransactions = [];
const creditLedger = [];

const walletValidators = {
  ETH: (value) => /^0x[a-fA-F0-9]{40}$/.test(value),
  BTC: (value) => /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{24,62}$/.test(value),
  SOL: (value) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value),
  LTC: (value) => /^(ltc1|L|M)[a-zA-HJ-NP-Z0-9]{24,62}$/.test(value)
};

const findUser = (userId) => users.find((user) => user.id === userId);

const isValidWalletAddress = (chain, address) => {
  const validator = walletValidators[chain];
  return Boolean(validator && validator(address));
};

const calculateCreditAmount = (amountUsd) => Math.floor(amountUsd * config.depositCreditsPerUsd);

const pageLayout = (title, body) => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; line-height: 1.4; }
    nav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    a { color: #0645ad; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    code { background: #f2f2f2; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>TradeInfo Mock App</h1>
  <nav>
    <a href="/">Home</a>
    <a href="/campaigns">Campaigns</a>
    <a href="/campaigns/new">Create Campaign</a>
    <a href="/wallet">Wallet</a>
    <a href="/wallet/collection">Collection</a>
    <a href="/wallet/compile">Compile Key</a>
    <a href="/wallet/credits">Credits</a>
    <a href="/account/register">Register</a>
    <a href="/payments/deposit">Deposit</a>
    <a href="/leaderboard">Leaderboard</a>
    <a href="/admin">Admin</a>
    <a href="/api/health">API Health</a>
    <a href="/api/config">API Config</a>
  </nav>
  ${body}
</body>
</html>
`;

app.get("/", (_req, res) => {
  res.send(
    pageLayout(
      "Home",
      `
      <div class="card">
        <h2>Purpose</h2>
        <p>Offline-friendly token clue game/fundraiser mock.</p>
      </div>
      <div class="card">
        <h2>Configured Defaults</h2>
        <ul>
          <li>Drop interval: <code>${config.dropIntervalMinutes} min</code></li>
          <li>Bid window: <code>${config.bidWindowSeconds} sec</code></li>
          <li>Unlock threshold: <code>${config.unlockThreshold}</code> clues</li>
          <li>Crypto provider source: <code>${config.cryptoProvider}</code></li>
          <li>Required wallets: <code>${config.requiredWalletChains.join(", ")}</code></li>
          <li>Credits per USD deposit: <code>${config.depositCreditsPerUsd}</code></li>
        </ul>
      </div>
      `
    )
  );
});

app.get("/campaigns", (_req, res) => {
  const cards = campaigns
    .map(
      (campaign) => `
      <div class="card">
        <h3><a href="/campaigns/${campaign.id}">${campaign.title}</a></h3>
        <p>${campaign.description}</p>
        <p><strong>Region:</strong> ${campaign.region} | <strong>Threshold:</strong> ${campaign.unlockThreshold}</p>
      </div>
      `
    )
    .join("");
  res.send(pageLayout("Campaigns", cards));
});

app.get("/campaigns/new", (_req, res) => {
  res.send(
    pageLayout(
      "Create Campaign",
      `
      <div class="card">
        <h2>Create Campaign (Mock)</h2>
        <p>Form wiring will be added later. Route is now visitable.</p>
        <p>Defaults: ${config.defaultDurationDays} days, drop every ${config.dropIntervalMinutes} minutes.</p>
      </div>
      `
    )
  );
});

app.get("/campaigns/:id", (req, res) => {
  const campaign = campaigns.find((item) => item.id === req.params.id);
  if (!campaign) {
    res.status(404).send(pageLayout("Not Found", `<p>Campaign ${req.params.id} not found.</p>`));
    return;
  }
  res.send(
    pageLayout(
      campaign.title,
      `
      <div class="card">
        <h2>${campaign.title}</h2>
        <p>${campaign.description}</p>
        <p><strong>Ends:</strong> ${campaign.endDate}</p>
      </div>
      <div class="card">
        <h3>Drop Routes</h3>
        <ul>
          <li><a href="/campaigns/${campaign.id}/drops/current">Current Drop</a></li>
          <li><a href="/campaigns/${campaign.id}/drops/upcoming">Upcoming Drops</a></li>
        </ul>
      </div>
      `
    )
  );
});

app.get("/campaigns/:id/drops/current", (req, res) => {
  const current = dropRounds.find((round) => round.campaignId === req.params.id && round.status === "active");
  if (!current) {
    res.send(pageLayout("Current Drop", `<p>No active drop for ${req.params.id}.</p>`));
    return;
  }
  res.send(
    pageLayout(
      "Current Drop",
      `
      <div class="card">
        <h2>Round ${current.roundId}</h2>
        <p>Status: ${current.status}</p>
        <p>Current high bid: ${current.currentHighBid}</p>
        <p>Closes at: ${current.closesAt}</p>
        <p><a href="/drops/${current.roundId}">Open round page</a></p>
      </div>
      `
    )
  );
});

app.get("/campaigns/:id/drops/upcoming", (req, res) => {
  const upcoming = dropRounds.filter((round) => round.campaignId === req.params.id && round.status === "upcoming");
  const content =
    upcoming.length === 0
      ? `<p>No upcoming rounds for ${req.params.id}.</p>`
      : upcoming
          .map(
            (round) => `
            <div class="card">
              <h3>${round.roundId}</h3>
              <p>Closes at ${round.closesAt}</p>
              <p><a href="/drops/${round.roundId}">View round</a></p>
            </div>
            `
          )
          .join("");
  res.send(pageLayout("Upcoming Drops", content));
});

app.get("/drops/:roundId", (req, res) => {
  const round = dropRounds.find((item) => item.roundId === req.params.roundId);
  if (!round) {
    res.status(404).send(pageLayout("Not Found", `<p>Drop round ${req.params.roundId} not found.</p>`));
    return;
  }
  res.send(
    pageLayout(
      `Drop ${round.roundId}`,
      `
      <div class="card">
        <h2>Drop Round ${round.roundId}</h2>
        <p>Status: ${round.status}</p>
        <p>Current high bid: ${round.currentHighBid}</p>
        <p>Bid window: ${config.bidWindowSeconds}s | Min bid: ${config.minBid}</p>
      </div>
      `
    )
  );
});

app.get("/wallet", (_req, res) => {
  res.send(
    pageLayout(
      "Wallet",
      `
      <div class="card">
        <h2>Wallet Overview (Mock)</h2>
        <p>Store imported QR tokens and verify signatures offline.</p>
      </div>
      `
    )
  );
});

app.get("/wallet/credits", (_req, res) => {
  const cards = users
    .map(
      (user) => `
      <div class="card">
        <h3>${user.username} (${user.id})</h3>
        <p><strong>Credits:</strong> ${user.credits}</p>
      </div>
      `
    )
    .join("");
  res.send(pageLayout("Credits", cards));
});

app.get("/wallet/collection", (_req, res) => {
  res.send(
    pageLayout(
      "Collection",
      `
      <div class="card">
        <h2>Collection (Mock)</h2>
        <ul>
          <li>Total collected: 42</li>
          <li>Unique valid: 31</li>
          <li>Duplicates: 11</li>
        </ul>
      </div>
      `
    )
  );
});

app.get("/wallet/compile", (_req, res) => {
  res.send(
    pageLayout(
      "Compile Key",
      `
      <div class="card">
        <h2>Compile Unlock Key (Mock)</h2>
        <p>Build key candidate from valid unique tokens.</p>
      </div>
      `
    )
  );
});

app.get("/account/register", (_req, res) => {
  res.send(
    pageLayout(
      "Register Account",
      `
      <div class="card">
        <h2>Register Account (Mock)</h2>
        <p>Registration requires wallet addresses for ETH, BTC, SOL, and LTC.</p>
        <p>Use API: <code>POST /api/users/register</code></p>
      </div>
      `
    )
  );
});

app.get("/payments/deposit", (_req, res) => {
  const treasuryList = supportedChains
    .map((chain) => `<li><strong>${chain}:</strong> <code>${config.treasuryWallets[chain]}</code></li>`)
    .join("");
  res.send(
    pageLayout(
      "Deposit Credits",
      `
      <div class="card">
        <h2>Deposit Flow (Mock)</h2>
        <ol>
          <li>Create deposit intent via <code>POST /api/payments/intents</code>.</li>
          <li>User sends funds to chain treasury wallet with returned reference memo.</li>
          <li>Submit tx hash via <code>POST /api/payments/confirm</code>.</li>
          <li>System validates destination, amount, confirmations, then awards credits.</li>
        </ol>
      </div>
      <div class="card">
        <h3>Treasury Wallets</h3>
        <ul>${treasuryList}</ul>
      </div>
      `
    )
  );
});

app.get("/leaderboard", (_req, res) => {
  res.send(
    pageLayout(
      "Leaderboard",
      `
      <div class="card">
        <h2>Leaderboard (Mock)</h2>
        <ol>
          <li>PlayerA - 83 points</li>
          <li>PlayerB - 77 points</li>
          <li>PlayerC - 68 points</li>
        </ol>
      </div>
      `
    )
  );
});

app.get("/admin", (_req, res) => {
  res.send(
    pageLayout(
      "Admin",
      `
      <div class="card">
        <h2>Admin (Mock)</h2>
        <p>Content moderation, campaign controls, and batch transparency logs.</p>
      </div>
      `
    )
  );
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "tradeinfo-mock-app" });
});

app.get("/api/config", (_req, res) => {
  res.json(config);
});

app.get("/api/campaigns", (_req, res) => {
  res.json(campaigns);
});

app.get("/api/campaigns/:id", (req, res) => {
  const campaign = campaigns.find((item) => item.id === req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "campaign_not_found" });
    return;
  }
  res.json(campaign);
});

app.post("/api/users/register", (req, res) => {
  const { username = "", wallets = {} } = req.body || {};
  if (typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({ error: "invalid_username" });
    return;
  }

  const normalizedWallets = {};
  for (const chain of config.requiredWalletChains) {
    const walletAddress = wallets?.[chain];
    if (typeof walletAddress !== "string" || walletAddress.trim().length === 0) {
      res.status(400).json({ error: "missing_wallet", chain });
      return;
    }
    if (!isValidWalletAddress(chain, walletAddress.trim())) {
      res.status(400).json({ error: "invalid_wallet_address", chain });
      return;
    }
    normalizedWallets[chain] = walletAddress.trim();
  }

  const id = `usr-${String(users.length + 1).padStart(3, "0")}`;
  const user = {
    id,
    username: username.trim(),
    wallets: normalizedWallets,
    credits: 0
  };
  users.push(user);
  res.status(201).json(user);
});

app.get("/api/users/:id", (req, res) => {
  const user = findUser(req.params.id);
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }
  res.json(user);
});

app.post("/api/payments/intents", (req, res) => {
  const { userId = "", chain = "", amountUsd = null } = req.body || {};
  const user = findUser(userId);
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }
  const normalizedChain = String(chain).toUpperCase();
  if (!supportedChains.includes(normalizedChain)) {
    res.status(400).json({ error: "unsupported_chain" });
    return;
  }
  if (typeof amountUsd !== "number" || Number.isNaN(amountUsd) || amountUsd <= 0) {
    res.status(400).json({ error: "invalid_amount_usd" });
    return;
  }

  const intent = {
    intentId: `pi-${Date.now()}`,
    userId: user.id,
    chain: normalizedChain,
    amountUsd,
    treasuryWallet: config.treasuryWallets[normalizedChain],
    requiredConfirmations: config.requiredChainConfirmations[normalizedChain] || 1,
    reference: crypto.randomBytes(6).toString("hex"),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  paymentIntents.push(intent);
  res.status(201).json(intent);
});

app.post("/api/payments/confirm", (req, res) => {
  const {
    intentId = "",
    txHash = "",
    toAddress = "",
    fromAddress = "",
    confirmations = null,
    amountUsd = null
  } = req.body || {};

  const intent = paymentIntents.find((item) => item.intentId === intentId);
  if (!intent) {
    res.status(404).json({ error: "intent_not_found" });
    return;
  }
  if (intent.status === "credited") {
    res.status(409).json({ error: "intent_already_credited" });
    return;
  }
  if (typeof txHash !== "string" || txHash.trim().length < 8) {
    res.status(400).json({ error: "invalid_tx_hash" });
    return;
  }
  if (typeof toAddress !== "string" || toAddress.trim().length === 0) {
    res.status(400).json({ error: "invalid_to_address" });
    return;
  }
  if (typeof fromAddress !== "string" || fromAddress.trim().length === 0) {
    res.status(400).json({ error: "invalid_from_address" });
    return;
  }
  if (typeof confirmations !== "number" || Number.isNaN(confirmations) || confirmations < 0) {
    res.status(400).json({ error: "invalid_confirmations" });
    return;
  }
  if (typeof amountUsd !== "number" || Number.isNaN(amountUsd) || amountUsd <= 0) {
    res.status(400).json({ error: "invalid_amount_usd" });
    return;
  }

  if (toAddress !== intent.treasuryWallet) {
    intent.status = "rejected_wrong_destination";
    res.status(400).json({ error: "wrong_treasury_destination", expected: intent.treasuryWallet });
    return;
  }

  if (confirmations < intent.requiredConfirmations) {
    intent.status = "awaiting_confirmations";
    res.status(202).json({
      intentId: intent.intentId,
      status: intent.status,
      requiredConfirmations: intent.requiredConfirmations,
      currentConfirmations: confirmations
    });
    return;
  }

  if (amountUsd < intent.amountUsd) {
    intent.status = "underpaid";
    res.status(400).json({
      error: "underpaid",
      expectedAmountUsd: intent.amountUsd,
      receivedAmountUsd: amountUsd
    });
    return;
  }

  const duplicateTx = paymentTransactions.find((item) => item.txHash === txHash.trim() && item.chain === intent.chain);
  if (duplicateTx) {
    res.status(409).json({ error: "tx_already_used" });
    return;
  }

  const creditDelta = calculateCreditAmount(amountUsd);
  const user = findUser(intent.userId);
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }

  user.credits += creditDelta;
  intent.status = "credited";
  intent.creditedAt = new Date().toISOString();
  intent.txHash = txHash.trim();

  paymentTransactions.push({
    txHash: txHash.trim(),
    intentId: intent.intentId,
    chain: intent.chain,
    fromAddress: fromAddress.trim(),
    toAddress: toAddress.trim(),
    amountUsd
  });

  creditLedger.push({
    ledgerId: `cl-${Date.now()}`,
    userId: user.id,
    source: "onchain_deposit",
    intentId: intent.intentId,
    txHash: txHash.trim(),
    credits: creditDelta,
    createdAt: new Date().toISOString()
  });

  res.json({
    intentId: intent.intentId,
    status: intent.status,
    credited: creditDelta,
    userId: user.id,
    newBalance: user.credits
  });
});

app.get("/api/payments/intents/:intentId", (req, res) => {
  const intent = paymentIntents.find((item) => item.intentId === req.params.intentId);
  if (!intent) {
    res.status(404).json({ error: "intent_not_found" });
    return;
  }
  res.json(intent);
});

app.get("/api/users/:id/credits/ledger", (req, res) => {
  const user = findUser(req.params.id);
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }
  const entries = creditLedger.filter((entry) => entry.userId === user.id);
  res.json(entries);
});

app.post("/api/drops/:roundId/bids", (req, res) => {
  const { amount = null, userId = "anonymous" } = req.body || {};
  const round = dropRounds.find((item) => item.roundId === req.params.roundId);
  if (!round) {
    res.status(404).json({ error: "round_not_found" });
    return;
  }
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    res.status(400).json({ error: "invalid_bid_amount" });
    return;
  }
  const user = findUser(userId);
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }
  if (user.credits < amount) {
    res.status(400).json({ error: "insufficient_credits", credits: user.credits, required: amount });
    return;
  }
  const accepted = amount >= config.minBid;
  res.json({
    roundId: round.roundId,
    userId,
    amount,
    accepted,
    reason: accepted ? "mock_bid_accepted" : "below_min_bid"
  });
});

app.post("/api/campaigns/:id/unlock-attempts", (req, res) => {
  const tokenIds = Array.isArray(req.body?.tokenIds) ? req.body.tokenIds : [];
  res.json({
    campaignId: req.params.id,
    submittedTokenCount: tokenIds.length,
    threshold: config.unlockThreshold,
    passed: tokenIds.length >= config.unlockThreshold,
    result: "mock_attempt_only"
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`TradeInfo mock app listening on http://localhost:${port}`);
});
