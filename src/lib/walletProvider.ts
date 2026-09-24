// Unified EIP-1193 provider access: browser-injected wallets or WalletConnect (QR / mobile).
export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<any>;
  disconnect?: () => Promise<void>;
};

// Polygon mainnet
export const AMOY_CHAIN_ID = 137;
export const POLYGON_CHAIN_ID = 137;
const AMOY_HEX = "0x89";
const AMOY_RPC = "https://polygon-rpc.com";

// Publishable project ID from https://cloud.reown.com
export const WALLETCONNECT_PROJECT_ID: string =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) || "";

export const hasInjectedWallet = () =>
  typeof window !== "undefined" && !!(window as any).ethereum;

let wcProvider: any = null;

export async function getWalletConnectProvider(): Promise<Eip1193Provider> {
  if (!WALLETCONNECT_PROJECT_ID) {
    throw new Error("Mobile wallet (QR) connection isn't set up yet. Please use a browser wallet or card payment.");
  }
  if (wcProvider) return wcProvider;
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  wcProvider = await EthereumProvider.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: [AMOY_CHAIN_ID],
    rpcMap: { [AMOY_CHAIN_ID]: AMOY_RPC },
    showQrModal: true,
    metadata: {
      name: "ARIGI",
      description: "Whisky casks direct from the distillery",
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.ico`],
    },
  });
  return wcProvider;
}

/** Connects the chosen wallet, switches to Polygon, returns provider + address. */
export async function connectWallet(
  source: "external" | "walletconnect",
): Promise<{ provider: Eip1193Provider; address: string }> {
  if (source === "walletconnect") {
    const provider: any = await getWalletConnectProvider();
    if (!provider.session) await provider.connect();
    const accounts: string[] = provider.accounts?.length
      ? provider.accounts
      : await provider.request({ method: "eth_requestAccounts" });
    return { provider, address: accounts[0] };
  }

  if (!hasInjectedWallet()) {
    throw new Error("No browser wallet detected. Install MetaMask, or choose Mobile Wallet (QR code).");
  }
  const provider = (window as any).ethereum as Eip1193Provider;
  const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: AMOY_HEX }] });
  } catch (err: any) {
    if (err?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: AMOY_HEX,
          chainName: "Polygon",
          nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
          rpcUrls: [AMOY_RPC],
          blockExplorerUrls: ["https://polygonscan.com"],
        }],
      });
    }
  }
  return { provider, address: accounts[0] };
}
