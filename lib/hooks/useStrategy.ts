import { useState, useEffect, useCallback } from "react";
import { Contract, BrowserProvider, ZeroAddress } from "ethers";
import { ADDRESSES } from "../contracts/addresses";
import { AGENT_STRATEGY_ABI } from "../contracts/abis";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Mirrors the on-chain Strategy struct (raw contract values). */
export interface Strategy {
  strategyType: number;   // 0=DCA, 1=Grid, 2=Momentum, 3=Arbitrage
  tokenIds:     number[]; // 0-5
  maxPosition:  bigint;   // USD, 6 decimals
  stopLoss:     bigint;   // basis points
  takeProfit:   bigint;   // basis points
  frequency:    number;   // 0=5m,1=15m,2=30m,3=1h,4=4h,5=1d
  usePathusd:   boolean;
  active:       boolean;
  updatedAt:    bigint;
}

/**
 * Human-friendly strategy input.
 * - maxPositionUsd: USD amount as a plain number (e.g. 1000 = $1,000)
 * - stopLossPct:    percentage as a number (e.g. 5 = 5%)
 * - takeProfitPct:  percentage as a number (e.g. 15 = 15%)
 */
export interface StrategyInput {
  strategyType:   number;
  tokenIds:       number[];
  maxPositionUsd: number;
  stopLossPct:    number;
  takeProfitPct:  number;
  frequency:      number;
  usePathusd:     boolean;
  active:         boolean;
}

export interface UseStrategyReturn {
  strategies: Record<number, Strategy | null>;
  setStrategy: (agentId: number, input: StrategyInput) => Promise<void>;
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

/** Convert human-friendly StrategyInput to contract-ready values. */
function toContractStrategy(input: StrategyInput): Strategy {
  return {
    strategyType: input.strategyType,
    tokenIds:     input.tokenIds,
    // maxPositionUsd in dollars -> multiply by 1e6 for 6-decimal USD bigint
    maxPosition:  BigInt(Math.round(input.maxPositionUsd * 1_000_000)),
    // stopLossPct %  -> basis points (×100)
    stopLoss:     BigInt(Math.round(input.stopLossPct  * 100)),
    // takeProfitPct % -> basis points (×100)
    takeProfit:   BigInt(Math.round(input.takeProfitPct * 100)),
    frequency:    input.frequency,
    usePathusd:   input.usePathusd,
    active:       input.active,
    updatedAt:    0n, // contract overwrites this
  };
}

const AGENT_IDS = [0, 1, 2] as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStrategy(account: string | null): UseStrategyReturn {
  const [strategies, setStrategies] = useState<Record<number, Strategy | null>>({ 0: null, 1: null, 2: null });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [tick, setTick]             = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // ─── Fetch strategies ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isDeployed(ADDRESSES.agentStrategy)) {
      setStrategies({ 0: null, 1: null, 2: null });
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = await getProvider();
        if (!provider) throw new Error("No provider");

        const contract = new Contract(ADDRESSES.agentStrategy, AGENT_STRATEGY_ABI, provider);

        const results = await Promise.all(
          AGENT_IDS.map(async (agentId) => {
            const has = (await contract.hasStrategy(agentId)) as boolean;
            if (!has) return { agentId, strategy: null };

            const raw = await contract.getStrategy(agentId) as {
              strategyType: bigint;
              tokenIds:     bigint[];
              maxPosition:  bigint;
              stopLoss:     bigint;
              takeProfit:   bigint;
              frequency:    bigint;
              usePathusd:   boolean;
              active:       boolean;
              updatedAt:    bigint;
            };

            const strategy: Strategy = {
              strategyType: Number(raw.strategyType),
              tokenIds:     raw.tokenIds.map(Number),
              maxPosition:  raw.maxPosition,
              stopLoss:     raw.stopLoss,
              takeProfit:   raw.takeProfit,
              frequency:    Number(raw.frequency),
              usePathusd:   raw.usePathusd,
              active:       raw.active,
              updatedAt:    raw.updatedAt,
            };

            return { agentId, strategy };
          })
        );

        if (!cancelled) {
          const map: Record<number, Strategy | null> = {};
          for (const { agentId, strategy } of results) {
            map[agentId] = strategy;
          }
          setStrategies(map);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch strategies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [account, tick]);

  // ─── Set strategy ─────────────────────────────────────────────────────────

  const setStrategy = useCallback(
    async (agentId: number, input: StrategyInput) => {
      if (!account) throw new Error("Wallet not connected");
      if (!isDeployed(ADDRESSES.agentStrategy)) throw new Error("AgentStrategy not deployed");

      const provider = await getProvider();
      if (!provider) throw new Error("No provider");

      const signer = await provider.getSigner(account);
      const contract = new Contract(ADDRESSES.agentStrategy, AGENT_STRATEGY_ABI, signer);

      const contractStrategy = toContractStrategy(input);

      const tx = await contract.setStrategy(agentId, [
        contractStrategy.strategyType,
        contractStrategy.tokenIds,
        contractStrategy.maxPosition,
        contractStrategy.stopLoss,
        contractStrategy.takeProfit,
        contractStrategy.frequency,
        contractStrategy.usePathusd,
        contractStrategy.active,
        contractStrategy.updatedAt,
      ]);
      await tx.wait();

      refetch();
    },
    [account, refetch]
  );

  return { strategies, setStrategy, loading, error, refetch };
}
