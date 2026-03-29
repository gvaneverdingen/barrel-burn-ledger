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
  
  const { isLoggedIn: isMagicLoggedIn, userMetadata: magicUserMetadata, walletAddress, logout: magicLogout } = useMagic();

  const checkProfileComplete = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, date_of_birth')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        if (import.meta.env.DEV) console.error('Profile check error:', error);
        setProfileComplete(false);
        return false;
      }
      
      const isComplete = !!(profile?.first_name && profile?.last_name && profile?.date_of_birth);
      setProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error checking profile completeness:', error);
      setProfileComplete(false);
      return false;
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch all roles from user_roles table and prioritize administrator
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const roles = rolesData?.map(r => r.role) || [];
      const prioritizedRole = roles.includes('administrator') 
        ? 'administrator' 
        : roles[0] || null;
      
      if (import.meta.env.DEV) console.log('Roles fetched:', roles.length, 'Prioritized:', prioritizedRole);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, date_of_birth')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching user profile:', error);
        setLoading(false);
        return;
      }
      
      if (profile) {
        setUserRole((prioritizedRole || 'consumer') as UserRole);
        const isComplete = !!(profile.first_name && profile.last_name && profile.date_of_birth);
        setProfileComplete(isComplete);
      } else {
        setUserRole('consumer');
        setProfileComplete(false);
      }
      
      setLoading(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error refreshing user data:', error);
      setLoading(false);
    }
  };

  const createMagicUser = async (email: string, walletAddress: string): Promise<User> => {
    const crypto = window.crypto || (window as any).msCrypto;
    const encoder = new TextEncoder();
    const data = encoder.encode(`magic_${walletAddress}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
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

    return mockUser;
  };

  useEffect(() => {
    let isInitialized = false;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.DEV) console.log('Auth state change:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            refreshUserData();
          }, 0);
        } else {
          setUserRole(null);
          setProfileComplete(false);
        }
        
        if (!isInitialized) {
          setLoading(false);
          isInitialized = true;
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          refreshUserData();
        }, 0);
      }
      
      if (!isInitialized) {
        setLoading(false);
        isInitialized = true;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleMagicAuth = async () => {
      if (session && !user?.user_metadata?.wallet_address) {
        return;
      }
      
      if (isMagicLoggedIn && magicUserMetadata?.email && walletAddress) {
        try {
          const magicUser = await createMagicUser(magicUserMetadata.email, walletAddress);
          
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', magicUser.id)
            .maybeSingle();
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, id, email, date_of_birth')
            .eq('id', magicUser.id)
            .maybeSingle();
          
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
          if (import.meta.env.DEV) console.error('Error handling Magic auth:', error);
          setUserRole('consumer');
          setProfileComplete(false);
          toast({
            title: "Magic Auth Error",
            description: "Failed to authenticate with Magic wallet",
            variant: "destructive",
          });
        }
      } else if (!isMagicLoggedIn && user?.user_metadata?.wallet_address) {
        setUser(null);
        setUserRole(null);
        setProfileComplete(false);
      }
    };

    const timeoutId = setTimeout(handleMagicAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [isMagicLoggedIn, magicUserMetadata, walletAddress]);

  const signUp = async (email: string, password: string, role: UserRole, additionalData?: any) => {
    const redirectUrl = `${window.location.origin}/`;

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

    if (error) {
      let errorMessage = error.message;
      let errorTitle = "Sign Up Error";
      
      if (error.message.includes('Email signups are disabled')) {
        errorTitle = "Sign Up Currently Unavailable";
        errorMessage = "Email signup is currently disabled. Please try signing up with Magic Wallet instead, or contact support.";
      } else if (error.message.includes('User already registered')) {
        errorTitle = "Account Already Exists";
        errorMessage = "An account with this email already exists. Please try signing in instead.";
      }
      
      toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
    } else {
      toast({
        title: "Sign Up Successful",
        description: "Please check your email and click the confirmation link to complete your registration.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. If you just signed up, please confirm your email first.";
      }
      
      toast({ title: "Sign In Error", description: errorMessage, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "You've been signed in successfully." });
    }

    return { error };
  };

  const signOut = async () => {
    if (user?.user_metadata?.wallet_address) {
      await magicLogout();
      setUser(null);
      setUserRole(null);
      setProfileComplete(false);
      toast({ title: "Signed Out", description: "You've been signed out successfully." });
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed Out", description: "You've been signed out successfully." });
    }
  };

  const value = {
    user, session, userRole, loading, profileComplete,
    signUp, signIn, signOut, refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
