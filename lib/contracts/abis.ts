// ─── ERC20 ───────────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from",   type: "address" },
      { name: "to",     type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ─── TempoAgentNFT (ERC1155) ─────────────────────────────────────────────────

export const AGENT_NFT_ABI = [
  // ERC1155 read
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id",      type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOfBatch",
    stateMutability: "view",
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "ids",      type: "uint256[]" },
    ],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "account",  type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  // Custom
  {
    type: "function",
    name: "mintBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ids",          type: "uint256[]" },
      { name: "amounts",      type: "uint256[]" },
      { name: "paymentToken", type: "address"   },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getOwnedAgents",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [
      { name: "ids",     type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
    ],
  },
  {
    type: "function",
    name: "priceOf",
    stateMutability: "pure",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "usdcAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "pathUsdAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Admin
  {
    type: "function",
    name: "setUsdcAddress",
    stateMutability: "nonpayable",
    inputs: [{ name: "_usdc", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setPathUsdAddress",
    stateMutability: "nonpayable",
    inputs: [{ name: "_pathUsd", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setTreasury",
    stateMutability: "nonpayable",
    inputs: [{ name: "_treasury", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setURI",
    stateMutability: "nonpayable",
    inputs: [{ name: "_uri", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // Events
  {
    type: "event",
    name: "AgentMinted",
    inputs: [
      { name: "owner",        type: "address",   indexed: true  },
      { name: "ids",          type: "uint256[]", indexed: false },
      { name: "amounts",      type: "uint256[]", indexed: false },
      { name: "paymentToken", type: "address",   indexed: false },
    ],
  },
  {
    type: "event",
    name: "TransferBatch",
    inputs: [
      { name: "operator", type: "address",   indexed: true  },
      { name: "from",     type: "address",   indexed: true  },
      { name: "to",       type: "address",   indexed: true  },
      { name: "ids",      type: "uint256[]", indexed: false },
      { name: "values",   type: "uint256[]", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TransferSingle",
    inputs: [
      { name: "operator", type: "address", indexed: true  },
      { name: "from",     type: "address", indexed: true  },
      { name: "to",       type: "address", indexed: true  },
      { name: "id",       type: "uint256", indexed: false },
      { name: "value",    type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── AgentVault ───────────────────────────────────────────────────────────────

export const AGENT_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "token",   type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "token",   type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getBalance",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "token",   type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTotalDeposited",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [
      { name: "usdcTotal", type: "uint256" },
      { name: "pathTotal", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "agentNFT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "usdcAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "pathUsdAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Admin
  {
    type: "function",
    name: "setAgentNFT",
    stateMutability: "nonpayable",
    inputs: [{ name: "_agentNFT", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setUsdcAddress",
    stateMutability: "nonpayable",
    inputs: [{ name: "_usdc", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setPathUsdAddress",
    stateMutability: "nonpayable",
    inputs: [{ name: "_pathUsd", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // Events
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "owner",   type: "address", indexed: true  },
      { name: "agentId", type: "uint256", indexed: true  },
      { name: "token",   type: "address", indexed: true  },
      { name: "amount",  type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "owner",   type: "address", indexed: true  },
      { name: "agentId", type: "uint256", indexed: true  },
      { name: "token",   type: "address", indexed: true  },
      { name: "amount",  type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── TokenPresale ─────────────────────────────────────────────────────────────

export const TOKEN_PRESALE_ABI = [
  {
    type: "function",
    name: "buy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId",    type: "uint256" },
      { name: "usdcAmount", type: "uint256" },
      { name: "usePathusd", type: "bool"    },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getPresaleInfo",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "token",   type: "address" },
      { name: "price",   type: "uint256" },
      { name: "raised",  type: "uint256" },
      { name: "cap",     type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "active",  type: "bool"    },
    ],
  },
  {
    type: "function",
    name: "getUserAllocation",
    stateMutability: "view",
    inputs: [
      { name: "user",    type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [
      { name: "usdcPaid",     type: "uint256" },
      { name: "tokenAmount",  type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getRaisedAmounts",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256[6]" }],
  },
  {
    type: "function",
    name: "claimEnabled",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "presales",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "tokenAddress", type: "address" },
      { name: "presalePrice", type: "uint256" },
      { name: "hardCap",      type: "uint256" },
      { name: "endTime",      type: "uint256" },
      { name: "active",       type: "bool"    },
    ],
  },
  // Admin
  {
    type: "function",
    name: "addPresale",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId",      type: "uint256" },
      { name: "tokenAddress", type: "address" },
      { name: "presalePrice", type: "uint256" },
      { name: "hardCap",      type: "uint256" },
      { name: "endTime",      type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setPresaleActive",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "active",  type: "bool"    },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setClaimEnabled",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "enabled", type: "bool"    },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawFunds",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token",  type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // Events
  {
    type: "event",
    name: "Purchased",
    inputs: [
      { name: "buyer",        type: "address", indexed: true  },
      { name: "tokenId",      type: "uint256", indexed: true  },
      { name: "usdcAmount",   type: "uint256", indexed: false },
      { name: "tokenAmount",  type: "uint256", indexed: false },
      { name: "paymentToken", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "claimer",     type: "address", indexed: true  },
      { name: "tokenId",     type: "uint256", indexed: true  },
      { name: "tokenAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PresaleAdded",
    inputs: [
      { name: "tokenId",      type: "uint256", indexed: true  },
      { name: "tokenAddress", type: "address", indexed: false },
      { name: "price",        type: "uint256", indexed: false },
      { name: "hardCap",      type: "uint256", indexed: false },
      { name: "endTime",      type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ClaimEnabled",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true  },
      { name: "enabled", type: "bool",    indexed: false },
    ],
  },
] as const;

// ─── AgentStrategy ────────────────────────────────────────────────────────────

export const AGENT_STRATEGY_ABI = [
  {
    type: "function",
    name: "setStrategy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      {
        name: "strategy",
        type: "tuple",
        components: [
          { name: "strategyType", type: "uint8"   },
          { name: "tokenIds",     type: "uint8[]" },
          { name: "maxPosition",  type: "uint256" },
          { name: "stopLoss",     type: "uint256" },
          { name: "takeProfit",   type: "uint256" },
          { name: "frequency",    type: "uint8"   },
          { name: "usePathusd",   type: "bool"    },
          { name: "active",       type: "bool"    },
          { name: "updatedAt",    type: "uint256" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getStrategy",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "strategyType", type: "uint8"   },
          { name: "tokenIds",     type: "uint8[]" },
          { name: "maxPosition",  type: "uint256" },
          { name: "stopLoss",     type: "uint256" },
          { name: "takeProfit",   type: "uint256" },
          { name: "frequency",    type: "uint8"   },
          { name: "usePathusd",   type: "bool"    },
          { name: "active",       type: "bool"    },
          { name: "updatedAt",    type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "hasStrategy",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "agentNFT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Admin
  {
    type: "function",
    name: "setAgentNFT",
    stateMutability: "nonpayable",
    inputs: [{ name: "_agentNFT", type: "address" }],
    outputs: [],
  },
  // Events
  {
    type: "event",
    name: "StrategyUpdated",
    inputs: [
      { name: "agentId",      type: "uint256", indexed: true  },
      { name: "owner",        type: "address", indexed: true  },
      { name: "strategyType", type: "uint8",   indexed: false },
      { name: "active",       type: "bool",    indexed: false },
      { name: "updatedAt",    type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── TempoLeaderboard ─────────────────────────────────────────────────────────

export const LEADERBOARD_ABI = [
  {
    type: "function",
    name: "updateStats",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId",    type: "uint256" },
      { name: "agentOwner", type: "address" },
      { name: "pnlUsd",     type: "int256"  },
      { name: "pnlBps",     type: "uint256" },
      { name: "tradeCount", type: "uint256" },
      { name: "winCount",   type: "uint256" },
      { name: "tvl",        type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getTopAgents",
    stateMutability: "view",
    inputs: [{ name: "count", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "agentId",     type: "uint256" },
          { name: "owner",       type: "address" },
          { name: "pnlUsd",      type: "int256"  },
          { name: "pnlBps",      type: "uint256" },
          { name: "tradeCount",  type: "uint256" },
          { name: "winCount",    type: "uint256" },
          { name: "tvl",         type: "uint256" },
          { name: "lastUpdated", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getAgentStats",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "agentId",     type: "uint256" },
          { name: "owner",       type: "address" },
          { name: "pnlUsd",      type: "int256"  },
          { name: "pnlBps",      type: "uint256" },
          { name: "tradeCount",  type: "uint256" },
          { name: "winCount",    type: "uint256" },
          { name: "tvl",         type: "uint256" },
          { name: "lastUpdated", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTotalStats",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "totalTvl",     type: "uint256" },
      { name: "totalTrades",  type: "uint256" },
      { name: "uniqueAgents", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "keeper",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Admin
  {
    type: "function",
    name: "setKeeper",
    stateMutability: "nonpayable",
    inputs: [{ name: "_keeper", type: "address" }],
    outputs: [],
  },
  // Events
  {
    type: "event",
    name: "StatsUpdated",
    inputs: [
      { name: "agentId",    type: "uint256", indexed: true  },
      { name: "owner",      type: "address", indexed: true  },
      { name: "pnlUsd",     type: "int256",  indexed: false },
      { name: "pnlBps",     type: "uint256", indexed: false },
      { name: "tradeCount", type: "uint256", indexed: false },
      { name: "winCount",   type: "uint256", indexed: false },
      { name: "tvl",        type: "uint256", indexed: false },
      { name: "updatedAt",  type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "KeeperUpdated",
    inputs: [
      { name: "newKeeper", type: "address", indexed: true },
    ],
  },
] as const;
