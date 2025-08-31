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
import { User, Settings, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const Profile = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
  });

  useEffect(() => {
    console.log('Profile useEffect - user:', user, 'loading:', loading);
    if (user && !loading) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    console.log('fetchProfile called - user:', user);
    if (!user) return;

    try {
      console.log('Fetching profile with user ID:', user.id);
      console.log('User email:', user.email);
      
      // First try to find by ID
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // If not found by ID, try to find by email (for Magic wallet users)
      if (!data && user.email) {
        console.log('Profile not found by ID, trying by email...');
        const { data: emailData, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        
        if (emailData && !emailError) {
          console.log('Found profile by email, updating ID to match Magic user...');
          // Update the profile ID to match the Magic wallet user ID
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ id: user.id })
            .eq('email', user.email);
          
          if (!updateError) {
            data = { ...emailData, id: user.id };
            console.log('Successfully updated profile ID');
          } else {
            console.error('Error updating profile ID:', updateError);
            data = emailData;
          }
        } else {
          error = emailError;
        }
      }

      if (error && !data) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          variant: "destructive",
        });
        return;
      }

      console.log('Profile data:', data);
      setProfile(data);
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          company_name: data.company_name || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

      setIsEditing(false);
      fetchProfile(); // Refresh the profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'distillery':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'investor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'consumer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerificationColor = (status: string | null) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-16 border-b flex items-center px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold ml-4">Profile</h1>
          </header>
          <div className="container max-w-4xl mx-auto px-4 py-8">

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your account information and preferences</p>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Account Information */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Your basic account details and verification status
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      Edit Profile
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Read-only fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <div className="text-sm font-medium bg-muted/50 px-3 py-2 rounded-md">
                        {profile?.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                      <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded-md truncate">
                        {profile?.id}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <div>
                        <Badge className={getRoleColor(profile?.role || '')}>
                          {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Verification Status</Label>
                      <div>
                        <Badge className={getVerificationColor(profile?.verification_status)}>
                          {profile?.verification_status?.charAt(0).toUpperCase() + profile?.verification_status?.slice(1) || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Editable fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        {isEditing ? (
                          <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            placeholder="Enter your first name"
                          />
                        ) : (
                          <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">
                            {profile?.first_name || 'Not provided'}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        {isEditing ? (
                          <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            placeholder="Enter your last name"
                          />
                        ) : (
                          <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">
                            {profile?.last_name || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </div>

                    {(userRole === 'distillery' || userRole === 'investor') && (
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        {isEditing ? (
                          <Input
                            id="company_name"
                            value={formData.company_name}
                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                            placeholder="Enter your company name"
                          />
                        ) : (
                          <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">
                            {profile?.company_name || 'Not provided'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2"
                      >
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

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Your account creation and activity information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                      <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Unknown'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                      <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">
                        {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Profile;