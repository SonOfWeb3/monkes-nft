import { useState, useEffect, useCallback } from "react";
import { Contract, BrowserProvider, ZeroAddress } from "ethers";
import { ADDRESSES, TOKEN_LIST } from "../contracts/addresses";
import { TOKEN_PRESALE_ABI, ERC20_ABI } from "../contracts/abis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresaleToken {
  id: number;
  symbol: string;
  name: string;
  color: string;
  presalePrice: bigint;
  raised: bigint;
  cap: bigint;
  endTime: number;
  active: boolean;
  userPaid: bigint;
  userAllocation: bigint;
}

export interface UsePresaleReturn {
  tokens:  PresaleToken[];
  buy:     (tokenId: number, usdcAmount: bigint, usePathusd: boolean) => Promise<void>;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDeployed(address: string): boolean {
  return address !== ZeroAddress && address !== "0x0000000000000000000000000000000000000000";
}

async function getProvider(): Promise<BrowserProvider | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  return new BrowserProvider(window.ethereum as import("ethers").Eip1193Provider);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePresale(account: string | null): UsePresaleReturn {
  const [tokens, setTokens]   = useState<PresaleToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [tick, setTick]       = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // ─── Fetch presale data ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isDeployed(ADDRESSES.tokenPresale)) {
      setTokens([]);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = await getProvider();
        if (!provider) throw new Error("No provider");

        const presale = new Contract(ADDRESSES.tokenPresale, TOKEN_PRESALE_ABI, provider);

        const results = await Promise.all(
          TOKEN_LIST.map(async (tok) => {
            // Fetch presale info
            const info = await presale.getPresaleInfo(tok.id) as {
              token: string;
              price: bigint;
              raised: bigint;
              cap: bigint;
              endTime: bigint;
              active: boolean;
            };

            // Fetch user allocation if account connected
            let userPaid = 0n;
            let userAllocation = 0n;

            if (account) {
              const alloc = await presale.getUserAllocation(account, tok.id) as {
                usdcPaid: bigint;
                tokenAmount: bigint;
              };
              userPaid = alloc.usdcPaid;
              userAllocation = alloc.tokenAmount;
            }

            return {
              id:             tok.id,
              symbol:         tok.symbol,
              name:           tok.name,
              color:          tok.color,
              presalePrice:   info.price,
              raised:         info.raised,
              cap:            info.cap,
              endTime:        Number(info.endTime),
              active:         info.active,
              userPaid,
              userAllocation,
            } satisfies PresaleToken;
          })
        );

        if (!cancelled) setTokens(results);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch presale data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [account, tick]);

  // ─── Buy ──────────────────────────────────────────────────────────────────

  const buy = useCallback(
    async (tokenId: number, usdcAmount: bigint, usePathusd: boolean) => {
      if (!account) throw new Error("Wallet not connected");
      if (!isDeployed(ADDRESSES.tokenPresale)) throw new Error("TokenPresale not deployed");

      const provider = await getProvider();
      if (!provider) throw new Error("No provider");

      const signer = await provider.getSigner(account);
      const paymentTokenAddress = usePathusd ? ADDRESSES.pathusd : ADDRESSES.usdc;

      if (!isDeployed(paymentTokenAddress)) {
        throw new Error(`${usePathusd ? "PATHUSD" : "USDC"} token not deployed`);
      }

      // Approve presale contract to pull payment
      const erc20 = new Contract(paymentTokenAddress, ERC20_ABI, signer);
      const approveTx = await erc20.approve(ADDRESSES.tokenPresale, usdcAmount);
      await approveTx.wait();

      const presale = new Contract(ADDRESSES.tokenPresale, TOKEN_PRESALE_ABI, signer);
      const tx = await presale.buy(tokenId, usdcAmount, usePathusd);
      await tx.wait();

      refetch();
    },
    [account, refetch]
  );

  return { tokens, buy, loading, error, refetch };
}
