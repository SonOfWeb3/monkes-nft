const { ethers } = require("hardhat");

// ── Presale parametreleri — istediğin gibi değiştir ──────────────────────────
const PRESALE_ADDRESS = "0x43368c8D99c14979B987251a4636Ab3e77C2C277";

const DURATION_DAYS = 10;
const PRICE_PER_USDC = 420;     // 1 USDC = 420 token
const HARD_CAP_USDC  = 100000;  // her token için 100k USDC cap

const TOKENS = [
  { id: 0, symbol: "AGENTZ", address: "0x7927276776D76Dc65e49EA607F6EC6Db0954EB84" },
  { id: 1, symbol: "CITCAT", address: "0x2ae977Bc18B5b05503e23a71147BDF4e8F03701A" },
  { id: 2, symbol: "NYAW",   address: "0x6A022B88d84EA3980D72AD66734faabb0769f73A" },
  { id: 3, symbol: "PUNK",   address: "0xD8864710F45C6C98Dd7E42c456b968C680C5c45A" },
  { id: 4, symbol: "TWILD",  address: "0x333Ff6e07C230E492cF751A7Fd5e04Cb6B2751d7" },
  { id: 5, symbol: "WHEL",   address: "0x0326FD7f9C5E4FA5FD9143D6242AAfc4B99fBAA9" },
];
// ─────────────────────────────────────────────────────────────────────────────

const ABI = [
  "function addPresale(uint256 tokenId, address tokenAddress, uint256 presalePrice, uint256 hardCap, uint256 endTime) external",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const presale = new ethers.Contract(PRESALE_ADDRESS, ABI, deployer);
  const endTime = Math.floor(Date.now() / 1000) + DURATION_DAYS * 86400;

  // presalePrice: tokenAmount = (usdcAmount * presalePrice) / 1e6
  // 1 USDC (1e6) → 420 token (420e18)  →  presalePrice = 420e18
  const presalePrice = ethers.parseUnits(PRICE_PER_USDC.toString(), 18);
  const hardCap      = ethers.parseUnits(HARD_CAP_USDC.toString(), 6);

  for (const tok of TOKENS) {
    console.log(`Setting up ${tok.symbol} presale...`);
    const tx = await presale.addPresale(tok.id, tok.address, presalePrice, hardCap, endTime);
    await tx.wait();
    console.log(`  ✓ ${tok.symbol}: 1 USDC = ${PRICE_PER_USDC} token, cap $${HARD_CAP_USDC}`);
  }

  console.log("\n✓ All presales configured!");
  console.log(`  Duration: ${DURATION_DAYS} days`);
  console.log(`  End time: ${new Date(endTime * 1000).toISOString()}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
