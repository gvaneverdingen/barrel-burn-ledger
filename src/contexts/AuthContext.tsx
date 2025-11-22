import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMagic } from './MagicContext';

type UserRole = 'distillery' | 'consumer' | 'investor' | 'administrator' | 'facilitator';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  profileComplete: boolean;
  signUp: (email: string, password: string, role: UserRole, additionalData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get Magic context
  const { isLoggedIn: isMagicLoggedIn, userMetadata: magicUserMetadata, walletAddress, logout: magicLogout } = useMagic();

  const checkProfileComplete = async (userId: string) => {
    try {
      console.log('🔍 AuthContext: Checking profile completeness for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, date_of_birth')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('🔍 AuthContext: Profile data:', profile, 'Error:', error);
      
      const isComplete = !!(profile?.first_name && profile?.last_name && profile?.date_of_birth);
      console.log('🔍 AuthContext: Profile complete check:', {
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        date_of_birth: profile?.date_of_birth,
        isComplete
      });
      
      setProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error('🔴 AuthContext: Error checking profile completeness:', error);
      setProfileComplete(false);
      return false;
    }
  };

  const refreshUserData = async () => {
    if (!user) {
      console.log('refreshUserData: No user, skipping');
      return;
    }
    
    try {
      console.log('refreshUserData called for user:', user.id, 'isMagicUser:', !!user.user_metadata?.wallet_address);
      
      // Fetch role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('refreshUserData: Role fetched:', roleData?.role);
      
      // Fetch profile data separately
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, date_of_birth')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
        return;
      }
      
      console.log('🔍 AuthContext refreshUserData: Profile result:', { profile, roleData, error });
      
      if (profile) {
        if (roleData) {
          console.log('Setting user role to:', roleData.role);
          setUserRole(roleData.role as UserRole);
        } else {
          console.log('No role data found, defaulting to consumer');
          setUserRole('consumer');
        }
        const isComplete = !!(profile.first_name && profile.last_name && profile.date_of_birth);
        console.log('🔍 AuthContext refreshUserData complete check:', { 
          userId: user.id, 
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_of_birth: profile.date_of_birth,
          isComplete,
          isMagicUser: !!user.user_metadata?.wallet_address 
        });
        console.log('🔍 AuthContext: Setting profileComplete to:', isComplete);
        setProfileComplete(isComplete);
      } else {
        // No profile found - profile is incomplete
        console.log('AuthContext refreshUserData: No profile found for user', user.id);
        setUserRole('consumer');
        setProfileComplete(false);
      }
      
      // Ensure loading is set to false after data fetch
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setLoading(false);
    }
  };

  const createMagicUser = async (email: string, walletAddress: string): Promise<User> => {
    // Create a synthetic User object for Magic wallet users
    // Generate a deterministic UUID from the wallet address
    const crypto = window.crypto || (window as any).msCrypto;
    const encoder = new TextEncoder();
    const data = encoder.encode(`magic_${walletAddress}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Format as UUID (8-4-4-4-12)
    const magicUserId = [
      hashHex.slice(0, 8),
      hashHex.slice(8, 12),
      hashHex.slice(12, 16),
      hashHex.slice(16, 20),
      hashHex.slice(20, 32)
    ].join('-');
    
    const mockUser: User = {
      id: magicUserId,
      app_metadata: {},
      user_metadata: { wallet_address: walletAddress },
      aud: 'authenticated',
      confirmation_sent_at: undefined,
      recovery_sent_at: undefined,
      email_change_sent_at: undefined,
      new_email: undefined,
      new_phone: undefined,
      invited_at: undefined,
      action_link: undefined,
      email: email,
      phone: undefined,
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      phone_confirmed_at: undefined,
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
      identities: [],
      factors: undefined,
      is_anonymous: false
    };

    // Note: We don't create profiles here anymore - that's handled in ProfileCompletion
    // This keeps the logic simpler and avoids duplicate email conflicts

    return mockUser;
  };

  useEffect(() => {
    console.log('AuthProvider mounting...');
    let isInitialized = false;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid auth callback deadlock
          setTimeout(() => {
            refreshUserData();
          }, 0);
        } else {
          setUserRole(null);
          setProfileComplete(false);
        }
        
        // Only set loading to false after initial setup
        if (!isInitialized) {
          setLoading(false);
          isInitialized = true;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          refreshUserData();
        }, 0);
      }
      
      // Set loading to false if not already set by auth listener
      if (!isInitialized) {
        setLoading(false);
        isInitialized = true;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Monitor Magic authentication state
  useEffect(() => {
    const handleMagicAuth = async () => {
      console.log('Magic auth state:', { isMagicLoggedIn, magicUserMetadata, walletAddress });
      
      // Skip if we already have a Supabase session (avoid conflicts)
      if (session && !user?.user_metadata?.wallet_address) {
        return;
      }
      
      if (isMagicLoggedIn && magicUserMetadata?.email && walletAddress) {
        try {
          // Create mock user for Magic wallet
          const magicUser = await createMagicUser(magicUserMetadata.email, walletAddress);
          
          // Fetch role from user_roles table
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', magicUser.id)
            .maybeSingle();
          
          // Simplified profile fetch logic
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, id, email, date_of_birth')
            .eq('id', magicUser.id)
            .maybeSingle();
          
          console.log('Magic auth profile fetch:', { 
            magicUserId: magicUser.id, 
            profile,
            roleData,
            profileExists: !!profile,
            isComplete: !!(profile?.first_name && profile?.last_name && profile?.date_of_birth)
          });
          
          setUser(magicUser);
          
          if (profile) {
            if (roleData) {
              setUserRole(roleData.role as UserRole);
            }
            setProfileComplete(!!(profile.first_name && profile.last_name && profile.date_of_birth));
          } else {
            setUserRole('consumer');
            setProfileComplete(false);
          }
          
          toast({
            title: "Magic Wallet Connected",
            description: "Successfully connected with Magic wallet.",
          });
        } catch (error) {
          console.error('Error handling Magic auth:', error);
          setUserRole('consumer');
          setProfileComplete(false);
          toast({
            title: "Magic Auth Error",
            description: "Failed to authenticate with Magic wallet",
            variant: "destructive",
          });
        }
      } else if (!isMagicLoggedIn && user?.user_metadata?.wallet_address) {
        // Magic user logged out
        console.log('Magic user logged out, clearing state');
        setUser(null);
        setUserRole(null);
        setProfileComplete(false);
      }
    };

    // Debounce the magic auth handling to prevent excessive calls
    const timeoutId = setTimeout(handleMagicAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [isMagicLoggedIn, magicUserMetadata, walletAddress]); // Removed session dependency to prevent loops

  const signUp = async (email: string, password: string, role: UserRole, additionalData?: any) => {
    console.log('SignUp attempt for:', email, 'with role:', role);
    
    const redirectUrl = `${window.location.origin}/`;
    console.log('Redirect URL:', redirectUrl);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role,
          first_name: additionalData?.firstName,
          last_name: additionalData?.lastName,
          company_name: additionalData?.companyName,
        }
      }
    });

    console.log('SignUp result:', { error });

    if (error) {
      console.error('SignUp error details:', error);
      
      // Handle specific error cases with more helpful messages
      let errorMessage = error.message;
      let errorTitle = "Sign Up Error";
      
      if (error.message.includes('Email signups are disabled')) {
        errorTitle = "Sign Up Currently Unavailable";
        errorMessage = "Email signup is currently disabled. Please try signing up with Magic Wallet instead, or contact support.";
      } else if (error.message.includes('User already registered')) {
        errorTitle = "Account Already Exists";
        errorMessage = "An account with this email already exists. Please try signing in instead.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sign Up Successful",
        description: "Please check your email and click the confirmation link to complete your registration. Check your spam folder if you don't see the email.",
        variant: "default",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('SignIn attempt for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('SignIn result:', { error });

    if (error) {
      console.error('SignIn error details:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in. Check your spam folder if you don't see it.";
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. If you just signed up, please confirm your email first.";
      }
      
      toast({
        title: "Sign In Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    // Handle Magic wallet logout  
    if (user?.user_metadata?.wallet_address) {
      await magicLogout();
      setUser(null);
      setUserRole(null);
      setProfileComplete(false);
      toast({
        title: "Signed Out",
        description: "You've been signed out successfully.",
      });
      return;
    }
    
    // Handle Supabase logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You've been signed out successfully.",
      });
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    profileComplete,
    signUp,
    signIn,
    signOut,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};