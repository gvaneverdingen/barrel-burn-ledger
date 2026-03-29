import React, { createContext, useContext, useEffect, useState } from 'react';
import { Magic } from 'magic-sdk';
import { ConnectExtension } from '@magic-ext/connect';
import { toast } from '@/hooks/use-toast';
import { getMagicConfig, validateMagicConfig } from '@/utils/magicConfig';
import { supabase } from '@/integrations/supabase/client';

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
  resetLoadingState: () => void;
  getUserWallets: () => Promise<any[]>;
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
      timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      
      try {
        const config = getMagicConfig();
        
        if (!validateMagicConfig(config)) {
          throw new Error('Invalid Magic configuration');
        }
        
        const magicInstance = new Magic(config.key, {
          extensions: [new ConnectExtension()],
          network: config.network,
          testMode: config.testMode,
        });

        setMagic(magicInstance);
        clearTimeout(timeoutId);
        setIsLoading(false);
        
        setTimeout(async () => {
          try {
            const isUserLoggedIn = await magicInstance.user.isLoggedIn();
            setIsLoggedIn(isUserLoggedIn);

            if (isUserLoggedIn) {
              await getUserInfo(magicInstance);
            }
          } catch (err) {
            if (import.meta.env.DEV) console.error('Error checking login status:', err);
          }
        }, 100);
        
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to initialize Magic:', error);
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
    if (!magicToUse) return;

    try {
      const metadata = await magicToUse.user.getInfo();
      setUserMetadata(metadata);
      setWalletAddress(metadata.publicAddress);
      
      if (metadata.publicAddress) {
        await saveWalletToDatabase(metadata.publicAddress, 'magic');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to get user metadata:', error);
    }
  };

  const saveWalletToDatabase = async (walletAddr: string, walletType: string = 'magic') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('id, is_primary')
        .eq('wallet_address', walletAddr)
        .eq('user_id', user.id)
        .single();

      if (!existingWallet) {
        const { data: userWallets } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id);

        const isPrimary = !userWallets || userWallets.length === 0;

        await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            wallet_address: walletAddr,
            wallet_type: walletType,
            is_primary: isPrimary,
            last_used_at: new Date().toISOString()
          });
      } else {
        await supabase
          .from('wallets')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', existingWallet.id);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error in saveWalletToDatabase:', error);
    }
  };

  const loginWithEmail = async (email: string) => {
    if (!magic) {
      throw new Error('Magic not initialized');
    }

    try {
      setIsLoading(true);
      
      try {
        const didToken = await magic.auth.loginWithEmailOTP({ email });
        if (!didToken) {
          throw new Error('No authentication token received from OTP');
        }
      } catch (error) {
        try {
          await magic.auth.loginWithMagicLink({ email });
        } catch (linkError: any) {
          throw new Error(`All Magic authentication methods failed: ${linkError.message}`);
        }
      }
      
      const loggedIn = await magic.user.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        await getUserInfo();
        toast({
          title: "Magic Login Successful",
          description: "You've been logged in with Magic wallet",
        });
      } else {
        throw new Error('Login verification failed');
      }
    } catch (error: any) {
      let errorMessage = "Failed to login with Magic";
      if (error.message?.includes('timeout')) {
        errorMessage = "Login timed out. Please check if popups are blocked and try again.";
      } else if (error.message?.includes('User denied') || error.message?.includes('User canceled')) {
        errorMessage = "Magic login was canceled. Please try again.";
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
      setIsLoading(false);
    }
  };

  const loginWithWallet = async () => {
    if (!magic) {
      throw new Error('Magic not initialized');
    }

    try {
      setIsLoading(true);
      
      const connectPromise = magic.wallet.connectWithUI();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Wallet connect timeout')), 30000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      setIsLoggedIn(true);
      await getUserInfo();
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully",
      });
    } catch (error: any) {
      let errorMessage = "Failed to connect wallet";
      if (error.message?.includes('timeout')) {
        errorMessage = "Wallet connect timed out. Please check if popups are blocked.";
      } else if (error.message?.includes('User denied') || error.message?.includes('User canceled')) {
        errorMessage = "Wallet connection was canceled. Please try again.";
      }
      
      toast({
        title: "Wallet Connection Error",
        description: errorMessage,
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
      if (import.meta.env.DEV) console.error('Magic logout error:', error);
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

  const getUserWallets = async (): Promise<any[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) return [];
      return wallets || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error in getUserWallets:', error);
      return [];
    }
  };

  const resetLoadingState = () => {
    setIsLoading(false);
  };

  const value = {
    magic, isLoggedIn, userMetadata, walletAddress, isLoading,
    loginWithEmail, loginWithWallet, logout, getWalletInfo,
    resetLoadingState, getUserWallets,
  };

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};
