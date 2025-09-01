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
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      
      const isComplete = !!(profile?.first_name && profile?.last_name);
      setProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      setProfileComplete(false);
      return false;
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      console.log('refreshUserData called for user:', user.id, 'isMagicUser:', !!user.user_metadata?.wallet_address);
      
      // For Magic wallet users, we need to check by their generated UUID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      console.log('refreshUserData profile result:', { profile, error });
      
      if (profile) {
        setUserRole(profile.role as UserRole);
        const isComplete = !!(profile.first_name && profile.last_name);
        console.log('AuthContext refreshUserData:', { 
          userId: user.id, 
          profile, 
          isComplete,
          isMagicUser: !!user.user_metadata?.wallet_address 
        });
        setProfileComplete(isComplete);
      } else {
        // No profile found - profile is incomplete
        console.log('AuthContext refreshUserData: No profile found for user', user.id);
        setUserRole('consumer');
        setProfileComplete(false);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
          setUser(magicUser);
          
          // Fetch the role and profile completeness from the database
          console.log('Magic auth: Looking for profile with ID:', magicUser.id);
          console.log('Magic auth: User email:', magicUser.email);
          
          // First try to find by ID
          let { data: profile } = await supabase
            .from('profiles')
            .select('role, first_name, last_name, id, email')
            .eq('id', magicUser.id)
            .maybeSingle();
          
          // If not found by ID, try to find by email and use existing profile
          if (!profile && magicUser.email) {
            console.log('Magic auth: No profile found by ID, searching by email...');
            const { data: emailProfile } = await supabase
              .from('profiles')
              .select('role, first_name, last_name, id, email')
              .eq('email', magicUser.email)
              .maybeSingle();
            
            if (emailProfile) {
              console.log('Magic auth: Found existing profile, using original profile ID');
              profile = emailProfile;
              // Update the Magic user to use the existing profile ID
              magicUser.id = emailProfile.id;
              setUser(magicUser);
            }
          }
          
          console.log('Magic auth profile fetch:', { 
            magicUserId: magicUser.id, 
            profile,
            profileExists: !!profile,
            isComplete: !!(profile?.first_name && profile?.last_name)
          });
          
          if (profile) {
            setUserRole(profile.role as UserRole);
            const isComplete = !!(profile.first_name && profile.last_name);
            setProfileComplete(isComplete);
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
        }
      } else if (!isMagicLoggedIn && user?.user_metadata?.wallet_address) {
        // Magic user logged out
        console.log('Magic user logged out, clearing state');
        setUser(null);
        setUserRole(null);
        setProfileComplete(false);
      }
    };

    handleMagicAuth();
  }, [isMagicLoggedIn, magicUserMetadata, walletAddress, session]); // Added session as dependency

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