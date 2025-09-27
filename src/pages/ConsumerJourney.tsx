import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { User, Settings, Save, Shield, CreditCard, Lock, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface UserProfile {
  id: string;
  email: string;
  role: 'distillery' | 'consumer' | 'investor' | 'administrator' | 'facilitator';
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string;
}

interface BankAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  bank_name: string;
  is_primary: boolean;
  created_at: string;
}

const ConsumerJourney = () => {
  const { user, userRole, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState<{[key: string]: boolean}>({});
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
  });
  const [bankFormData, setBankFormData] = useState({
    account_name: '',
    account_number: '',
    routing_number: '',
    bank_name: '',
    is_primary: false,
  });

  useEffect(() => {
    if (user && !loading) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfile(profileData);
      if (profileData) {
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          company_name: profileData.company_name || '',
        });
      }

      // Fetch bank accounts (would need to create this table)
      // For now, we'll use mock data
      setBankAccounts([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          company_name: formData.company_name || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBankInputChange = (field: string, value: string | boolean) => {
    setBankFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleShowAccount = (accountId: string) => {
    setShowAccountNumber(prev => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  if (!user) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1">
            <header className="h-16 border-b flex items-center px-6">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold ml-4 luxury-text-gradient">Secure Profile</h1>
            </header>
            <div className="container max-w-4xl mx-auto px-4 py-8">
              <div className="text-center">
                <p>Please log in to manage your secure profile.</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (loading || isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1">
            <header className="h-16 border-b flex items-center px-6">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold ml-4 luxury-text-gradient">Secure Profile</h1>
            </header>
            <div className="container max-w-4xl mx-auto px-4 py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading secure profile...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full luxury-hero-bg">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-16 border-b backdrop-blur-sm bg-background/80 flex items-center px-6 sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold ml-4 luxury-text-gradient">Secure Profile & Credentials</h1>
          </header>
          
          <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
              <h2 className="text-4xl font-bold luxury-text-gradient">Your Secure Investment Profile</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Manage your personal information, credentials, and banking details for secure whisky cask investments
              </p>
            </div>

            {/* Personal Information */}
            <Card className="luxury-card hover-scale animate-scale-in">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Your identity and verification details
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email Address</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{profile?.email}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Account Role</Label>
                    <div className="p-3 bg-muted/50 rounded-md">
                      <Badge variant="outline" className="capitalize">
                        {profile?.role || 'Consumer'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    {isEditing ? (
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md">
                        {profile?.first_name || 'Not provided'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    {isEditing ? (
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md">
                        {profile?.last_name || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          first_name: profile?.first_name || '',
                          last_name: profile?.last_name || '',
                          company_name: profile?.company_name || '',
                        });
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card className="luxury-card hover-scale animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Banking & Payment Details
                  </CardTitle>
                  <CardDescription>
                    Secure payment methods for transactions and withdrawals
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingBank(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">No bank accounts added</h3>
                      <p className="text-muted-foreground text-sm">
                        Add a bank account to enable secure transactions and withdrawals
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankAccounts.map((account) => (
                      <div key={account.id} className="p-4 border border-border/50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{account.bank_name}</h4>
                              <p className="text-sm text-muted-foreground">{account.account_name}</p>
                            </div>
                          </div>
                          {account.is_primary && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Account: </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">
                                {showAccountNumber[account.id] ? account.account_number : maskAccountNumber(account.account_number)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleShowAccount(account.id)}
                                className="h-6 w-6 p-0"
                              >
                                {showAccountNumber[account.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Routing: </span>
                            <span className="font-mono">{account.routing_number}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security & Verification */}
            <Card className="luxury-card hover-scale animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security & Verification
                </CardTitle>
                <CardDescription>
                  Your account security status and verification level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Identity Verified</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  </div>
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Payment Methods</h4>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {bankAccounts.length} Connected
                    </Badge>
                  </div>
                  <div className="text-center p-4 border border-border/50 rounded-lg">
                    <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">2FA Security</h4>
                    <Badge variant="outline">
                      Enabled
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ConsumerJourney;