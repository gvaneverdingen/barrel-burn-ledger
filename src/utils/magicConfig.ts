/**
 * Magic SDK configuration utility
 * Handles environment-specific key management and settings
 */

interface MagicConfig {
  key: string;
  testMode: boolean;
  network: {
    rpcUrl: string;
    chainId: number;
  };
}

/**
 * Gets the appropriate Magic key based on environment
 */
const getMagicKey = (): string => {
  // Get Magic key from environment variable (set via Supabase secrets)
  const magicKey = import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY;
  
  if (!magicKey) {
    console.error('ERROR: MAGIC_PUBLISHABLE_KEY is not configured');
    console.error('Please add your Magic.link publishable key as a secret');
    console.error('Get your key from: https://dashboard.magic.link/');
    throw new Error('Magic.link API key not configured. Please add MAGIC_PUBLISHABLE_KEY secret.');
  }

  return magicKey;
};

/**
 * Gets Magic SDK configuration based on current environment
 */
export const getMagicConfig = (): MagicConfig => {
  const magicKey = getMagicKey();
  
  // Use test mode only if the key is a test key (pk_test_)
  // Production keys (pk_live_) must use production mode
  const isTestKey = magicKey.startsWith('pk_test_');

  return {
    key: magicKey,
    testMode: isTestKey,
    network: {
      rpcUrl: 'https://polygon-rpc.com',
      chainId: 137, // Polygon mainnet
    },
  };
};

/**
 * Validates Magic configuration
 */
export const validateMagicConfig = (config: MagicConfig): boolean => {
  if (!config.key || config.key.length < 10) {
    console.error('Invalid Magic key provided');
    return false;
  }

  if (!config.network.rpcUrl) {
    console.error('Invalid RPC URL provided');
    return false;
  }

  return true;
};