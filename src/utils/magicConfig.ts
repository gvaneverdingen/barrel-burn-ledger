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
  const isDevelopment = 
    window.location.hostname.includes('sandbox.lovable.dev') || 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('.dev') ||
    process.env.NODE_ENV === 'development';

  return {
    key: getMagicKey(),
    testMode: isDevelopment,
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