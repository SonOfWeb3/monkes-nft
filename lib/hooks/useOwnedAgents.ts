import { useState, useEffect, useCallback } from "react";
import { Contract, BrowserProvider, ZeroAddress } from "ethers";
import { ADDRESSES, AGENT_LIST } from "../contracts/addresses";
import { AGENT_NFT_ABI } from "../contracts/abis";

export interface OwnedAgent {
  id: number;
  name: string;
  image: string;
  rarity: string;
  rarityColor: string;
  amount: number; // how many of this agent the user owns
}

export interface UseOwnedAgentsReturn {
  ownedAgents: OwnedAgent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function isDeployed(address: string): boolean {
  return address !== ZeroAddress && address !== "0x0000000000000000000000000000000000000000";
}

export function useOwnedAgents(account: string | null): UseOwnedAgentsReturn {
  const [ownedAgents, setOwnedAgents] = useState<OwnedAgent[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [tick, setTick]               = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!account || !isDeployed(ADDRESSES.agentNFT)) {
      setOwnedAgents([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        if (typeof window === "undefined" || !window.ethereum) throw new Error("No provider");
        const provider = new BrowserProvider(window.ethereum as import("ethers").Eip1193Provider);
        const nft = new Contract(ADDRESSES.agentNFT, AGENT_NFT_ABI, provider);

        // Try getOwnedAgents first (returns ids[] + amounts[])
        let owned: OwnedAgent[] = [];
        try {
          const result = await nft.getOwnedAgents(account) as [bigint[], bigint[]];
          const ids     = result[0];
          const amounts = result[1];

          const mapped: (OwnedAgent | null)[] = ids.map((id, i) => {
            const agentId = Number(id);
            const amount  = Number(amounts[i]);
            if (amount === 0) return null;
            const meta = AGENT_LIST.find((a) => a.id === agentId);
            if (!meta) return null;
            return { id: meta.id, name: meta.name, image: meta.image, rarity: meta.rarity, rarityColor: meta.rarityColor, amount } as OwnedAgent;
          });
          owned = mapped.filter((x): x is OwnedAgent => x !== null);
        } catch {
          // Fallback: manually check balanceOf for each agent id (0,1,2)
          const results: (OwnedAgent | null)[] = await Promise.all(
            AGENT_LIST.map(async (agent) => {
              const bal = (await nft.balanceOf(account, agent.id)) as bigint;
              if (bal === BigInt(0)) return null;
              return { id: agent.id, name: agent.name, image: agent.image, rarity: agent.rarity, rarityColor: agent.rarityColor, amount: Number(bal) } as OwnedAgent;
            })
          );
          owned = results.filter((x): x is OwnedAgent => x !== null);
        }

        if (!cancelled) setOwnedAgents(owned);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch owned agents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [account, tick]);

  return { ownedAgents, loading, error, refetch };
}
