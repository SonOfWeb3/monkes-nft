const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const USDC    = "0x20c000000000000000000000b9537d11c60e8b50";
const PATHUSD = "0x20c0000000000000000000000000000000000000";

const TOKENS = [
  { name: "Tempo Agentz", symbol: "AGENTZ", maxSupply: ethers.parseUnits("1000000000", 18) },
  { name: "Cit Cat",      symbol: "CITCAT", maxSupply: ethers.parseUnits("1000000000", 18) },
  { name: "Nyaw",         symbol: "NYAW",   maxSupply: ethers.parseUnits("1000000000", 18) },
  { name: "Punk",         symbol: "PUNK",   maxSupply: ethers.parseUnits("1000000000", 18) },
  { name: "Twild",        symbol: "TWILD",  maxSupply: ethers.parseUnits("1000000000", 18) },
  { name: "Whel",         symbol: "WHEL",   maxSupply: ethers.parseUnits("1000000000", 18) },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const treasury = deployer.address;
  const keeper   = deployer.address;

  // 1. TempoAgentNFT
  console.log("\n[1/6] Deploying TempoAgentNFT...");
  const NFT = await ethers.getContractFactory("TempoAgentNFT");
  const nft = await NFT.deploy(
    "https://metadata.tempoagentz.com/{id}.json",
    USDC, PATHUSD, treasury
  );
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("  TempoAgentNFT:", nftAddress);

  // 2. AgentVault
  console.log("[2/6] Deploying AgentVault...");
  const Vault = await ethers.getContractFactory("AgentVault");
  const vault = await Vault.deploy(nftAddress, USDC, PATHUSD);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("  AgentVault:", vaultAddress);

  // 3. TokenPresale
  console.log("[3/6] Deploying TokenPresale...");
  const Presale = await ethers.getContractFactory("TokenPresale");
  const presale = await Presale.deploy(USDC, PATHUSD, treasury);
  await presale.waitForDeployment();
  const presaleAddress = await presale.getAddress();
  console.log("  TokenPresale:", presaleAddress);

  // 4. AgentStrategy
  console.log("[4/6] Deploying AgentStrategy...");
  const Strategy = await ethers.getContractFactory("AgentStrategy");
  const strategy = await Strategy.deploy(nftAddress);
  await strategy.waitForDeployment();
  const strategyAddress = await strategy.getAddress();
  console.log("  AgentStrategy:", strategyAddress);

  // 5. TempoLeaderboard
  console.log("[5/6] Deploying TempoLeaderboard...");
  const Leaderboard = await ethers.getContractFactory("TempoLeaderboard");
  const leaderboard = await Leaderboard.deploy(keeper);
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("  TempoLeaderboard:", leaderboardAddress);

  // 6. TempoToken x6
  console.log("[6/6] Deploying TempoTokens...");
  const Token = await ethers.getContractFactory("TempoToken");
  const tokenAddresses = {};
  for (const tok of TOKENS) {
    const token = await Token.deploy(tok.name, tok.symbol, tok.maxSupply);
    await token.waitForDeployment();
    tokenAddresses[tok.symbol] = await token.getAddress();
    console.log(`  ${tok.symbol}: ${tokenAddresses[tok.symbol]}`);
  }

  // Update addresses.ts
  const addressesPath = path.join(__dirname, "../lib/contracts/addresses.ts");
  const content = `export const ADDRESSES = {
  agentNFT:      "${nftAddress}",
  agentVault:    "${vaultAddress}",
  tokenPresale:  "${presaleAddress}",
  agentStrategy: "${strategyAddress}",
  leaderboard:   "${leaderboardAddress}",
  usdc:          "${USDC}",
  pathusd:       "${PATHUSD}",
  tokens: {
    AGENTZ: "${tokenAddresses.AGENTZ}",
    CITCAT: "${tokenAddresses.CITCAT}",
    NYAW:   "${tokenAddresses.NYAW}",
    PUNK:   "${tokenAddresses.PUNK}",
    TWILD:  "${tokenAddresses.TWILD}",
    WHEL:   "${tokenAddresses.WHEL}",
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
`;

  fs.writeFileSync(addressesPath, content);
  console.log("\n addresses.ts updated.");

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("TempoAgentNFT:   ", nftAddress);
  console.log("AgentVault:      ", vaultAddress);
  console.log("TokenPresale:    ", presaleAddress);
  console.log("AgentStrategy:   ", strategyAddress);
  console.log("TempoLeaderboard:", leaderboardAddress);
  Object.entries(tokenAddresses).forEach(([sym, addr]) => {
    console.log(`${sym.padEnd(8)}:`, addr);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
