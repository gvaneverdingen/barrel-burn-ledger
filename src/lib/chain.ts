/**
 * Single source of truth for which Polygon network the site's on-chain links use.
 * Set VITE_POLYGON_NETWORK=mainnet when contracts move to mainnet.
 */
export type PolygonNetwork = 'amoy' | 'mainnet';

export const POLYGON_NETWORK: PolygonNetwork =
  (import.meta.env.VITE_POLYGON_NETWORK as string) === 'mainnet' ? 'mainnet' : 'amoy';

export const IS_TESTNET = POLYGON_NETWORK !== 'mainnet';

export const EXPLORER_BASE = IS_TESTNET ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com';

export const NETWORK_LABEL = IS_TESTNET ? 'Polygon Amoy' : 'Polygon';

export const explorerTxUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;
export const explorerAddressUrl = (address: string) => `${EXPLORER_BASE}/address/${address}`;
export const explorerTokenUrl = (contract: string, tokenId: number | string) =>
  `${EXPLORER_BASE}/nft/${contract}/${tokenId}`;
