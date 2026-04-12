import { useState, useEffect, useCallback } from "react";
import { Contract, BrowserProvider, ZeroAddress } from "ethers";
import { ADDRESSES, TOKEN_LIST } from "../contracts/addresses";
import { ERC20_ABI, AGENT_VAULT_ABI } from "../contracts/abis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenBalance {
  tokenId: number;
  symbol:  string;
  color:   string;
  balance: bigint;
}

export interface UsePortfolioReturn {
  usdcBalance:    bigint;
  pathBalance:    bigint;
  tokenBalances:  TokenBalance[];
  vaultTvl:       bigint;
  loading:        boolean;
  error:          string | null;
  refetch:        () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDeployed(address: string): boolean {
  return address !== ZeroAddress && address !== "0x0000000000000000000000000000000000000000";
}

async function getProvider(): Promise<BrowserProvider | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  return new BrowserProvider(window.ethereum as import("ethers").Eip1193Provider);
}

const TOKEN_ADDRESSES: Record<string, string> = {
  AGENTZ: ADDRESSES.tokens.AGENTZ,
  CITCAT: ADDRESSES.tokens.CITCAT,
  NYAW:   ADDRESSES.tokens.NYAW,
  PUNK:   ADDRESSES.tokens.PUNK,
  TWILD:  ADDRESSES.tokens.TWILD,
  WHEL:   ADDRESSES.tokens.WHEL,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePortfolio(account: string | null): UsePortfolioReturn {
  const [usdcBalance, setUsdcBalance]     = useState<bigint>(0n);
  const [pathBalance, setPathBalance]     = useState<bigint>(0n);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [vaultTvl, setVaultTvl]           = useState<bigint>(0n);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [tick, setTick]                   = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!account) {
      setUsdcBalance(0n);
      setPathBalance(0n);
      setTokenBalances([]);
      setVaultTvl(0n);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = await getProvider();
        if (!provider) throw new Error("No provider");

        // ── USDC balance ────────────────────────────────────────────────────
        let _usdc = 0n;
        if (isDeployed(ADDRESSES.usdc)) {
          const usdcContract = new Contract(ADDRESSES.usdc, ERC20_ABI, provider);
          _usdc = (await usdcContract.balanceOf(account)) as bigint;
        }

        // ── PATHUSD balance ─────────────────────────────────────────────────
        let _path = 0n;
        if (isDeployed(ADDRESSES.pathusd)) {
          const pathContract = new Contract(ADDRESSES.pathusd, ERC20_ABI, provider);
          _path = (await pathContract.balanceOf(account)) as bigint;
        }

        // ── Trading token balances ──────────────────────────────────────────
        const _tokenBalances: TokenBalance[] = await Promise.all(
          TOKEN_LIST.map(async (tok) => {
            const addr = TOKEN_ADDRESSES[tok.symbol];
            let balance = 0n;
            if (isDeployed(addr)) {
              const contract = new Contract(addr, ERC20_ABI, provider);
              balance = (await contract.balanceOf(account)) as bigint;
            }
            return {
              tokenId: tok.id,
              symbol:  tok.symbol,
              color:   tok.color,
              balance,
            };
          })
        );

        // ── Vault TVL (USDC + PATHUSD across all 3 agents) ─────────────────
        // TODO: Incorporate token price feeds for accurate USD TVL.
        //       Currently only sums stablecoin (USDC + PATHUSD) vault balances.
        let _vaultTvl = 0n;
        if (isDeployed(ADDRESSES.agentVault)) {
          const vault = new Contract(ADDRESSES.agentVault, AGENT_VAULT_ABI, provider);
          const totals = await vault.getTotalDeposited(account) as {
            usdcTotal: bigint;
            pathTotal: bigint;
          };
          _vaultTvl = totals.usdcTotal + totals.pathTotal;
        }

        if (!cancelled) {
          setUsdcBalance(_usdc);
          setPathBalance(_path);
          setTokenBalances(_tokenBalances);
          setVaultTvl(_vaultTvl);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch portfolio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [account, tick]);

  return { usdcBalance, pathBalance, tokenBalances, vaultTvl, loading, error, refetch };
}
