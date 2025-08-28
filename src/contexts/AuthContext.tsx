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
  const [loading, setLoading] = useState(true);
  
  // Get Magic context
  const { isLoggedIn: isMagicLoggedIn, userMetadata: magicUserMetadata, walletAddress, logout: magicLogout } = useMagic();

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (profile) {
        setUserRole(profile.role as UserRole);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const createMagicUser = async (email: string, walletAddress: string): Promise<User> => {
    // Create a synthetic User object for Magic wallet users
    const magicUserId = `magic_${walletAddress}`;
    
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

    // Try to create or update profile in Supabase
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', magicUserId)
        .maybeSingle();

      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: magicUserId,
            email: email,
            role: 'consumer' as UserRole,
            first_name: email.split('@')[0],
          });

        if (insertError) {
          console.error('Error creating Magic user profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error handling Magic user profile:', error);
    }

    return mockUser;
  };

  useEffect(() => {
    console.log('AuthProvider mounting...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        }
        
        setLoading(false);
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
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Monitor Magic authentication state
  useEffect(() => {
    const handleMagicAuth = async () => {
      console.log('Magic auth state:', { isMagicLoggedIn, magicUserMetadata, walletAddress });
      
      if (isMagicLoggedIn && magicUserMetadata?.email && walletAddress) {
        // Create mock user for Magic wallet
        const magicUser = await createMagicUser(magicUserMetadata.email, walletAddress);
        setUser(magicUser);
        setUserRole('consumer');
        setLoading(false);
        
        toast({
          title: "Magic Wallet Connected",
          description: "Successfully connected with Magic wallet.",
        });
      } else if (!isMagicLoggedIn && user?.id?.startsWith('magic_')) {
        // Magic user logged out
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    };

    handleMagicAuth();
  }, [isMagicLoggedIn, magicUserMetadata, walletAddress]);

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
      toast({
        title: "Sign Up Error",
        description: error.message,
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
    if (user?.id?.startsWith('magic_')) {
      await magicLogout();
      setUser(null);
      setUserRole(null);
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
    signUp,
    signIn,
    signOut,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};