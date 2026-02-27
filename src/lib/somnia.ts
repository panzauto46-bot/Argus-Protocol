import { defineChain } from "viem";

export const SOMNIA_TESTNET_CHAIN_ID = 50312;
export const SOMNIA_TESTNET_CHAIN_HEX = "0xC488";
export const SOMNIA_TESTNET_RPC_HTTP = "https://dream-rpc.somnia.network";
export const SOMNIA_TESTNET_RPC_WS = "wss://dream-rpc.somnia.network/ws";
export const SOMNIA_TESTNET_EXPLORER = "https://shannon-explorer.somnia.network/";

export const somniaTestnet = defineChain({
  id: SOMNIA_TESTNET_CHAIN_ID,
  name: "Somnia Testnet",
  network: "somnia-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "STT",
    symbol: "STT",
  },
  rpcUrls: {
    default: {
      http: [SOMNIA_TESTNET_RPC_HTTP],
      webSocket: [SOMNIA_TESTNET_RPC_WS],
    },
    public: {
      http: [SOMNIA_TESTNET_RPC_HTTP],
      webSocket: [SOMNIA_TESTNET_RPC_WS],
    },
  },
  blockExplorers: {
    default: { name: "Somnia Testnet Explorer", url: SOMNIA_TESTNET_EXPLORER },
  },
});

export function shortenAddress(address: string): string {
  if (!address) return "";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
