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
    const initializeMagic = async () => {
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

        setMagic(magicInstance);

        // Check if user is already logged in
        const isUserLoggedIn = await magicInstance.user.isLoggedIn();
        setIsLoggedIn(isUserLoggedIn);

        if (isUserLoggedIn) {
          await getUserInfo(magicInstance);
        }
      } catch (error) {
        console.error('Failed to initialize Magic:', error);
        toast({
          title: "Magic Wallet Error",
          description: "Failed to initialize Magic wallet",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeMagic();
  }, []);

  const getUserInfo = async (magicInstance?: Magic) => {
    const magicToUse = magicInstance || magic;
    if (!magicToUse) return;

    try {
      const metadata = await magicToUse.user.getInfo();
      setUserMetadata(metadata);
      setWalletAddress(metadata.publicAddress);
    } catch (error) {
      console.error('Failed to get user metadata:', error);
    }
  };

  const loginWithEmail = async (email: string) => {
    if (!magic) {
      throw new Error('Magic not initialized');
    }

    try {
      setIsLoading(true);
      
      // Check if Magic is properly initialized
      console.log('Magic login attempt with email:', email);
      console.log('Magic instance ready:', !!magic);
      
      // Use loginWithMagicLink instead of OTP for better reliability
      await magic.auth.loginWithMagicLink({ email });
      
      // Verify login succeeded
      const isLoggedIn = await magic.user.isLoggedIn();
      console.log('Magic login success check:', isLoggedIn);
      
      setIsLoggedIn(isLoggedIn);
      
      if (isLoggedIn) {
        await getUserInfo();
        toast({
          title: "Magic Login Successful",
          description: "You've been logged in with Magic wallet",
        });
      } else {
        throw new Error('Login verification failed');
      }
    } catch (error: any) {
      console.error('Magic login error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to login with Magic";
      if (error.message?.includes('User canceled')) {
        errorMessage = "Magic login was canceled. Please try again and complete the login process.";
      } else if (error.message?.includes('popup')) {
        errorMessage = "Please allow popups for this site and try again.";
      }
      
      toast({
        title: "Magic Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = async () => {
    if (!magic) {
      throw new Error('Magic not initialized');
    }

    try {
      setIsLoading(true);
      await magic.wallet.connectWithUI();
      setIsLoggedIn(true);
      await getUserInfo();
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully",
      });
    } catch (error: any) {
      console.error('Magic wallet connect error:', error);
      toast({
        title: "Wallet Connection Error",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
      throw error;
    } finally {
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
