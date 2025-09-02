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
  const isDevelopment = 
    window.location.hostname.includes('sandbox.lovable.dev') || 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('.dev') ||
    process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Use universal test key for development
    return 'pk_live_51449C034B2302B9';
  }

  // For production, you should use environment-specific keys
  // This would typically come from environment variables
  return 'pk_live_51449C034B2302B9'; // Fallback to test key
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