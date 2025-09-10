import React, { createContext, useContext, useEffect, useState } from 'react';
import { Magic } from 'magic-sdk';
import { ConnectExtension } from '@magic-ext/connect';
import { toast } from '@/hooks/use-toast';
import { getMagicConfig, validateMagicConfig } from '@/utils/magicConfig';

interface MagicContextType {
  magic: Magic | null;
  isLoggedIn: boolean;
  userMetadata: any | null;
  walletAddress: string | null;
  isLoading: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  logout: () => Promise<void>;
  getWalletInfo: () => Promise<void>;
}

const MagicContext = createContext<MagicContextType | undefined>(undefined);

export const useMagic = () => {
  const context = useContext(MagicContext);
  if (context === undefined) {
    throw new Error('useMagic must be used within a MagicProvider');
  }
  return context;
};

export const MagicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [magic, setMagic] = useState<Magic | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState<any | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeMagic = async () => {
      console.log('🟡 MagicContext: Starting Magic initialization');
      
      // Force loading to false after 3 seconds maximum
      timeoutId = setTimeout(() => {
        console.log('🔴 MagicContext: Timeout - forcing loading to false');
        setIsLoading(false);
      }, 3000);
      
      try {
        const config = getMagicConfig();
        
        if (!validateMagicConfig(config)) {
          throw new Error('Invalid Magic configuration');
        }
        
        console.log('Magic initializing for domain:', window.location.hostname);
        console.log('Using Magic key:', config.key.substring(0, 10) + '...');
        
        const magicInstance = new Magic(config.key, {
          extensions: [new ConnectExtension()],
          network: config.network,
          testMode: config.testMode,
        });

        console.log('🟡 MagicContext: Magic instance created');
        setMagic(magicInstance);
        
        // Clear timeout since we're about to finish
        clearTimeout(timeoutId);
        
        console.log('🟢 MagicContext: Magic initialization completed successfully');
        setIsLoading(false);
        
        // Check login status after loading is set to false
        setTimeout(async () => {
          try {
            const isUserLoggedIn = await magicInstance.user.isLoggedIn();
            console.log('🟡 MagicContext: User logged in status:', isUserLoggedIn);
            setIsLoggedIn(isUserLoggedIn);

            if (isUserLoggedIn) {
              console.log('🟡 MagicContext: Getting user info for logged in user');
              await getUserInfo(magicInstance);
            }
          } catch (err) {
            console.error('🔴 MagicContext: Error checking login status:', err);
          }
        }, 100);
        
      } catch (error) {
        console.error('🔴 MagicContext: Failed to initialize Magic:', error);
        clearTimeout(timeoutId);
        setIsLoading(false);
        toast({
          title: "Magic Wallet Error",
          description: "Failed to initialize Magic wallet",
          variant: "destructive",
        });
      }
    };

    initializeMagic();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const getUserInfo = async (magicInstance?: Magic) => {
    const magicToUse = magicInstance || magic;
    if (!magicToUse) {
      console.log('🟡 MagicContext: No magic instance for getUserInfo');
      return;
    }

    try {
      console.log('🟡 MagicContext: Getting user metadata');
      const metadata = await magicToUse.user.getInfo();
      console.log('🟡 MagicContext: User metadata received:', metadata);
      setUserMetadata(metadata);
      setWalletAddress(metadata.publicAddress);
    } catch (error) {
      console.error('🔴 MagicContext: Failed to get user metadata:', error);
    }
  };

  const loginWithEmail = async (email: string) => {
    console.log('🟡 MagicContext: loginWithEmail called with email:', email);
    
    if (!magic) {
      console.error('🔴 MagicContext: Magic not initialized');
      throw new Error('Magic not initialized');
    }

    try {
      console.log('🟡 MagicContext: Starting email login process');
      setIsLoading(true);
      
      console.log('🟡 MagicContext: Magic instance ready:', !!magic);
      
      // Use loginWithMagicLink with proper configuration
      console.log('🟡 MagicContext: Calling magic.auth.loginWithMagicLink');
      const didToken = await magic.auth.loginWithMagicLink({ 
        email,
        redirectURI: window.location.origin + '/auth'
      });
      
      console.log('🟡 MagicContext: Magic login DID token received:', !!didToken);
      
      // Verify login succeeded
      console.log('🟡 MagicContext: Checking if user is logged in');
      const isLoggedIn = await magic.user.isLoggedIn();
      console.log('🟡 MagicContext: Magic login success check:', isLoggedIn);
      
      setIsLoggedIn(isLoggedIn);
      
      if (isLoggedIn) {
        console.log('🟡 MagicContext: Getting user info');
        await getUserInfo();
        console.log('🟢 MagicContext: Email login successful');
        toast({
          title: "Magic Login Successful",
          description: "You've been logged in with Magic wallet",
        });
      } else {
        console.error('🔴 MagicContext: Login verification failed');
        throw new Error('Login verification failed');
      }
    } catch (error: any) {
      console.error('🔴 MagicContext: Magic login error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to login with Magic";
      if (error.message?.includes('User denied') || error.message?.includes('User canceled')) {
        errorMessage = "Magic login was canceled. Please try again and complete the login process.";
      } else if (error.message?.includes('popup') || error.message?.includes('blocked')) {
        errorMessage = "Please allow popups for this site and try again.";
      } else if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Magic Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      console.log('🟡 MagicContext: Setting loading to false');
      setIsLoading(false);
    }
  };

  const loginWithWallet = async () => {
    console.log('🟡 MagicContext: loginWithWallet called');
    
    if (!magic) {
      console.error('🔴 MagicContext: Magic not initialized');
      throw new Error('Magic not initialized');
    }

    try {
      console.log('🟡 MagicContext: Starting wallet connect with UI');
      setIsLoading(true);
      
      console.log('🟡 MagicContext: Calling magic.wallet.connectWithUI()');
      await magic.wallet.connectWithUI();
      
      console.log('🟡 MagicContext: Wallet UI completed, setting logged in');
      setIsLoggedIn(true);
      await getUserInfo();
      
      console.log('🟢 MagicContext: Wallet connection successful');
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully",
      });
    } catch (error: any) {
      console.error('🔴 MagicContext: Magic wallet connect error:', error);
      toast({
        title: "Wallet Connection Error",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
      throw error;
    } finally {
      console.log('🟡 MagicContext: Setting loading to false');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!magic) return;

    try {
      await magic.user.logout();
      setIsLoggedIn(false);
      setUserMetadata(null);
      setWalletAddress(null);
      
      toast({
        title: "Logged Out",
        description: "You've been logged out of Magic wallet",
      });
    } catch (error: any) {
      console.error('Magic logout error:', error);
      toast({
        title: "Logout Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const getWalletInfo = async () => {
    await getUserInfo();
  };

  const value = {
    magic,
    isLoggedIn,
    userMetadata,
    walletAddress,
    isLoading,
    loginWithEmail,
    loginWithWallet,
    logout,
    getWalletInfo,
  };

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};
