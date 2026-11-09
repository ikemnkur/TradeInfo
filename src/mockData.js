const campaigns = [
  {
    id: "cmp-001",
    title: "Campus Treasure Archive",
    description: "Collect clues and unlock the public RAR file before expiry.",
    region: "Lagos",
    unlockThreshold: 60,
    endDate: "2027-11-08T00:00:00Z"
  },
  {
    id: "cmp-002",
    title: "Music Vault Hunt",
    description: "Bid on token drops and trade clues in person.",
    region: "Nairobi",
    unlockThreshold: 75,
    endDate: "2027-06-01T00:00:00Z"
  }
];

const dropRounds = [
  {
    roundId: "rnd-1001",
    campaignId: "cmp-001",
    status: "active",
    currentHighBid: 13.5,
    closesAt: "2026-11-09T06:10:00Z"
  },
  {
    roundId: "rnd-1002",
    campaignId: "cmp-001",
    status: "upcoming",
    currentHighBid: 0,
    closesAt: "2026-11-09T06:20:00Z"
  }
];

const users = [
  {
    id: "usr-001",
    username: "playerOne",
    wallets: {
      ETH: "0x1111111111111111111111111111111111111111",
      BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      SOL: "So11111111111111111111111111111111111111112",
      LTC: "ltc1qg82u0k7dt6sk7e47ph6f8k9q9a0w4kg0h3h5pz"
    },
    credits: 125
  }
];

module.exports = {
  campaigns,
  dropRounds,
  users
};
