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
      
      // Save wallet to database
      if (metadata.publicAddress) {
        await saveWalletToDatabase(metadata.publicAddress, 'magic');
      }
    } catch (error) {
      console.error('🔴 MagicContext: Failed to get user metadata:', error);
    }
  };

  const saveWalletToDatabase = async (walletAddress: string, walletType: string = 'magic') => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🟡 MagicContext: No authenticated user for wallet save');
        return;
      }

      // Check if wallet already exists
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('id, is_primary')
        .eq('wallet_address', walletAddress)
        .eq('user_id', user.id)
        .single();

      if (!existingWallet) {
        // Check if user has any existing wallets to determine if this should be primary
        const { data: userWallets } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id);

        const isPrimary = !userWallets || userWallets.length === 0;

        // Insert new wallet
        const { error } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            wallet_address: walletAddress,
            wallet_type: walletType,
            is_primary: isPrimary,
            last_used_at: new Date().toISOString()
          });

        if (error) {
          console.error('🔴 MagicContext: Failed to save wallet to database:', error);
        } else {
          console.log('🟢 MagicContext: Wallet saved to database successfully');
        }
      } else {
        // Update last_used_at for existing wallet
        const { error } = await supabase
          .from('wallets')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', existingWallet.id);

        if (error) {
          console.error('🔴 MagicContext: Failed to update wallet last_used_at:', error);
        } else {
          console.log('🟢 MagicContext: Wallet last_used_at updated');
        }
      }
    } catch (error) {
      console.error('🔴 MagicContext: Error in saveWalletToDatabase:', error);
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
      
      // Try using loginWithEmailOTP instead of loginWithMagicLink
      console.log('🟡 MagicContext: Trying loginWithEmailOTP instead of magic link');
      
      try {
        // Use OTP method which might work better
        const didToken = await magic.auth.loginWithEmailOTP({ email });
        console.log('🟡 MagicContext: Email OTP login completed, didToken:', !!didToken);
        
        if (didToken) {
          console.log('🟢 MagicContext: OTP Login successful with token');
        } else {
          console.log('🔴 MagicContext: No token returned from OTP');
          throw new Error('No authentication token received from OTP');
        }
      } catch (error) {
        console.error('🔴 MagicContext: Email OTP failed, trying magic link fallback:', error);
        
        // Fallback to magic link if OTP fails
        try {
          console.log('🟡 MagicContext: Fallback to magic link');
          const didToken = await magic.auth.loginWithMagicLink({ email });
          console.log('🟡 MagicContext: Magic link fallback completed:', !!didToken);
        } catch (linkError) {
          console.error('🔴 MagicContext: Both OTP and Magic Link failed:', linkError);
          throw new Error(`All Magic authentication methods failed: ${linkError.message}`);
        }
      }
      
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
      if (error.message?.includes('timeout')) {
        errorMessage = "Login timed out. Please check if popups are blocked and try again.";
      } else if (error.message?.includes('User denied') || error.message?.includes('User canceled')) {
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
      
      // Add timeout to the wallet connect call
      const connectPromise = magic.wallet.connectWithUI();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Wallet connect timeout - please check for popup blockers')), 30000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
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
      
      let errorMessage = "Failed to connect wallet";
      if (error.message?.includes('timeout')) {
        errorMessage = "Wallet connect timed out. Please check if popups are blocked and try again.";
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

  const getUserWallets = async (): Promise<any[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🟡 MagicContext: No authenticated user for getUserWallets');
        return [];
      }

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔴 MagicContext: Failed to fetch user wallets:', error);
        return [];
      }

      return wallets || [];
    } catch (error) {
      console.error('🔴 MagicContext: Error in getUserWallets:', error);
      return [];
    }
  };

  // Add a reset function for debugging
  const resetLoadingState = () => {
    console.log('🔄 MagicContext: Force resetting loading state');
    setIsLoading(false);
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
    resetLoadingState,
    getUserWallets,
  };

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};
