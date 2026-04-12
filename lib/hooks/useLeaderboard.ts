import { useState, useEffect, useCallback } from "react";
import { Contract, JsonRpcProvider, ZeroAddress } from "ethers";
import { ADDRESSES, AGENT_LIST } from "../contracts/addresses";
import { LEADERBOARD_ABI } from "../contracts/abis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank:       number;
  agentId:    number;
  owner:      string;
  pnlUsd:     bigint;
  pnlBps:     number;
  tradeCount: number;
  winCount:   number;
  tvl:        bigint;
  agent:      (typeof AGENT_LIST)[number];
}

export interface TotalStats {
  totalTvl:     bigint;
  totalTrades:  number;
  uniqueAgents: number;
}

export interface UseLeaderboardReturn {
  entries:    LeaderboardEntry[];
  totalStats: TotalStats;
  loading:    boolean;
  error:      string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDeployed(address: string): boolean {
  return address !== ZeroAddress && address !== "0x0000000000000000000000000000000000000000";
}

// Leaderboard is read-only so we can use a public JSON-RPC provider.
// Falls back to window.ethereum if available.
async function getReadProvider(): Promise<JsonRpcProvider | null> {
  try {
    return new JsonRpcProvider("https://rpc.tempo.network");
  } catch {
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLeaderboard(): UseLeaderboardReturn {
  const [entries, setEntries]       = useState<LeaderboardEntry[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats>({
    totalTvl: BigInt(0), totalTrades: 0, uniqueAgents: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isDeployed(ADDRESSES.leaderboard)) {
      setEntries([]);
      setTotalStats({ totalTvl: 0n, totalTrades: 0, uniqueAgents: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = await getReadProvider();
      if (!provider) throw new Error("No RPC provider available");

      const contract = new Contract(ADDRESSES.leaderboard, LEADERBOARD_ABI, provider);

      // Fetch top agents (request all 3 agent slots)
      const [rawTop, rawTotals] = await Promise.all([
        contract.getTopAgents(50) as Promise<Array<{
          agentId:     bigint;
          owner:       string;
          pnlUsd:      bigint;
          pnlBps:      bigint;
          tradeCount:  bigint;
          winCount:    bigint;
          tvl:         bigint;
          lastUpdated: bigint;
        }>>,
        contract.getTotalStats() as Promise<{
          totalTvl:     bigint;
          totalTrades:  bigint;
          uniqueAgents: bigint;
        }>,
      ]);

      const mapped: LeaderboardEntry[] = rawTop.map((row, idx) => {
        const agentId = Number(row.agentId);
        const agentMeta = AGENT_LIST.find((a) => a.id === agentId) ?? AGENT_LIST[0];
        return {
          rank:       idx + 1,
          agentId,
          owner:      row.owner,
          pnlUsd:     row.pnlUsd,
          pnlBps:     Number(row.pnlBps),
          tradeCount: Number(row.tradeCount),
          winCount:   Number(row.winCount),
          tvl:        row.tvl,
          agent:      agentMeta,
        };
      });

      setEntries(mapped);
      setTotalStats({
        totalTvl:     rawTotals.totalTvl,
        totalTrades:  Number(rawTotals.totalTrades),
        uniqueAgents: Number(rawTotals.uniqueAgents),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, totalStats, loading, error };
}
