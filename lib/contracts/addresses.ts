export const ADDRESSES = {
  agentNFT:      "0x380230682c1ff61e86f6A2da663EBD1B4aD8D90a",
  agentVault:    "0xD1Cbe093c9981Af6f7cbd75AB64F4e37012C0C24",
  tokenPresale:  "0x43368c8D99c14979B987251a4636Ab3e77C2C277",
  agentStrategy: "0xA3f1C9baf4C8b6636ba9E492E268adf711641E69",
  leaderboard:   "0xb68a3A5EF64a28cF92C7732dEaF5B550860362C6",
  usdc:          "0x20c000000000000000000000b9537d11c60e8b50",
  pathusd:       "0x20c0000000000000000000000000000000000000",
  tokens: {
    AGENTZ: "0x7927276776D76Dc65e49EA607F6EC6Db0954EB84",
    CITCAT: "0x2ae977Bc18B5b05503e23a71147BDF4e8F03701A",
    NYAW:   "0x6A022B88d84EA3980D72AD66734faabb0769f73A",
    PUNK:   "0xD8864710F45C6C98Dd7E42c456b968C680C5c45A",
    TWILD:  "0x333Ff6e07C230E492cF751A7Fd5e04Cb6B2751d7",
    WHEL:   "0x0326FD7f9C5E4FA5FD9143D6242AAfc4B99fBAA9",
  },
} as const;

export const TOKEN_LIST = [
  { id: 0, symbol: "AGENTZ", name: "Tempo Agentz",  color: "#f59e0b", image: "/tokens/agentz.png",  verified: true  },
  { id: 1, symbol: "CITCAT", name: "Cit Cat",       color: "#60a5fa", image: "/tokens/citcat.jpg",  verified: false },
  { id: 2, symbol: "NYAW",   name: "Nyaw",          color: "#a78bfa", image: "/tokens/nyaw.jpg",    verified: false },
  { id: 3, symbol: "PUNK",   name: "Punk",          color: "#34d399", image: "/tokens/punk.jpg",    verified: false },
  { id: 4, symbol: "TWILD",  name: "Twild",         color: "#fb7185", image: "/tokens/twild.jpg",   verified: false },
  { id: 5, symbol: "WHEL",   name: "Whel",          color: "#fbbf24", image: "/tokens/whel.jpg",    verified: false },
] as const;

export const AGENT_LIST = [
  { id: 0, name: "Agent Bravo",   image: "/agent-bravo.png",   rarity: "COMMON",    rarityColor: "#9ca3af" },
  { id: 1, name: "Agent Charlie", image: "/agent-charlie.png", rarity: "RARE",      rarityColor: "#60a5fa" },
  { id: 2, name: "Agent Delta",   image: "/agent-delta.png",   rarity: "LEGENDARY", rarityColor: "#f59e0b" },
] as const;
