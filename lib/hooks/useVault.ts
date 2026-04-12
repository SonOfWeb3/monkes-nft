import { useState, useEffect, useCallback } from "react";
import { Contract, BrowserProvider, ZeroAddress } from "ethers";
import { ADDRESSES } from "../contracts/addresses";
import { AGENT_VAULT_ABI, ERC20_ABI } from "../contracts/abis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultBalance {
  agentId: number;
  usdc: bigint;
  pathusd: bigint;
}

export interface UseVaultReturn {
  balances: VaultBalance[];
  deposit:  (agentId: number, token: "usdc" | "pathusd", amount: bigint) => Promise<void>;
  withdraw: (agentId: number, token: "usdc" | "pathusd", amount: bigint) => Promise<void>;
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

const AGENT_IDS = [0, 1, 2] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDeployed(address: string): boolean {
  return address !== ZeroAddress && address !== "0x0000000000000000000000000000000000000000";
}

async function getProvider(): Promise<BrowserProvider | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  return new BrowserProvider(window.ethereum as import("ethers").Eip1193Provider);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVault(account: string | null): UseVaultReturn {
  const [balances, setBalances] = useState<VaultBalance[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [tick, setTick]         = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // ─── Fetch balances ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!account || !isDeployed(ADDRESSES.agentVault)) {
      setBalances([]);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = await getProvider();
        if (!provider) throw new Error("No provider");

        const vault = new Contract(ADDRESSES.agentVault, AGENT_VAULT_ABI, provider);

        const results = await Promise.all(
          AGENT_IDS.map(async (agentId) => {
            const [usdc, pathusd] = await Promise.all([
              vault.getBalance(account, agentId, ADDRESSES.usdc)   as Promise<bigint>,
              vault.getBalance(account, agentId, ADDRESSES.pathusd) as Promise<bigint>,
            ]);
            return { agentId, usdc, pathusd };
          })
        );

        if (!cancelled) setBalances(results);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch vault balances");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [account, tick]);

  // ─── Deposit ──────────────────────────────────────────────────────────────

  const deposit = useCallback(
    async (agentId: number, token: "usdc" | "pathusd", amount: bigint) => {
      if (!account) throw new Error("Wallet not connected");
      if (!isDeployed(ADDRESSES.agentVault)) throw new Error("AgentVault not deployed");

      const provider = await getProvider();
      if (!provider) throw new Error("No provider");

      const signer = await provider.getSigner(account);
      const tokenAddress = token === "usdc" ? ADDRESSES.usdc : ADDRESSES.pathusd;

      if (!isDeployed(tokenAddress)) throw new Error(`${token.toUpperCase()} not deployed`);

      // Approve vault to spend tokens
      const erc20 = new Contract(tokenAddress, ERC20_ABI, signer);
      const approveTx = await erc20.approve(ADDRESSES.agentVault, amount);
      await approveTx.wait();

      const vault = new Contract(ADDRESSES.agentVault, AGENT_VAULT_ABI, signer);
      const tx = await vault.deposit(agentId, tokenAddress, amount);
      await tx.wait();

      refetch();
    },
    [account, refetch]
  );

  // ─── Withdraw ─────────────────────────────────────────────────────────────

  const withdraw = useCallback(
    async (agentId: number, token: "usdc" | "pathusd", amount: bigint) => {
      if (!account) throw new Error("Wallet not connected");
      if (!isDeployed(ADDRESSES.agentVault)) throw new Error("AgentVault not deployed");

      const provider = await getProvider();
      if (!provider) throw new Error("No provider");

      const signer = await provider.getSigner(account);
      const tokenAddress = token === "usdc" ? ADDRESSES.usdc : ADDRESSES.pathusd;

      const vault = new Contract(ADDRESSES.agentVault, AGENT_VAULT_ABI, signer);
      const tx = await vault.withdraw(agentId, tokenAddress, amount);
      await tx.wait();

      refetch();
    },
    [account, refetch]
  );

  return { balances, deposit, withdraw, loading, error, refetch };
}
