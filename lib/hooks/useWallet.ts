import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

const TEMPO_CHAIN_ID = "0x1079";

export interface WalletState {
  account: string | null;
  chainId: string | null;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  switchToTempo: () => Promise<void>;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

export function useWallet(): WalletState {
  const [account, setAccount]   = useState<string | null>(null);
  const [chainId, setChainId]   = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner]     = useState<JsonRpcSigner | null>(null);

  const isCorrectNetwork = chainId?.toLowerCase() === TEMPO_CHAIN_ID.toLowerCase();

  const init = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const _provider = new BrowserProvider(window.ethereum as import("ethers").Eip1193Provider);
    setProvider(_provider);
    try {
      const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      const _chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      setChainId(_chainId);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const _signer = await _provider.getSigner(accounts[0]);
        setSigner(_signer);
      }
    } catch { /* not connected yet */ }
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const handleAccountsChanged = async (accounts: unknown) => {
      const list = accounts as string[];
      if (list.length === 0) { setAccount(null); setSigner(null); }
      else {
        setAccount(list[0]);
        if (provider) {
          try { setSigner(await provider.getSigner(list[0])); } catch { setSigner(null); }
        }
      }
    };
    const handleChainChanged = (id: unknown) => { setChainId(id as string); init(); };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, init]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet detected.");
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    const _chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    setChainId(_chainId);
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      const _provider = provider ?? new BrowserProvider(window.ethereum as import("ethers").Eip1193Provider);
      if (!provider) setProvider(_provider);
      setSigner(await _provider.getSigner(accounts[0]));
    }
  }, [provider]);

  const switchToTempo = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet detected.");
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: TEMPO_CHAIN_ID }] });
    } catch (e: unknown) {
      if ((e as { code?: number })?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: TEMPO_CHAIN_ID,
            chainName: "Tempo Mainnet",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.tempo.xyz"],
            blockExplorerUrls: ["https://explorer.tempo.xyz"],
          }],
        });
      } else { throw e; }
    }
  }, []);

  return { account, chainId, isCorrectNetwork, connectWallet, switchToTempo, provider, signer };
}
