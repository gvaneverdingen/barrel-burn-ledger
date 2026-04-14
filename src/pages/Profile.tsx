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
import { AvatarUpload } from '@/components/AvatarUpload';
import { Settings, Save, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SignInPrompt } from '@/components/SignInPrompt';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  date_of_birth: string | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user, userRole, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    date_of_birth: undefined as Date | undefined,
  });

  useEffect(() => {
    if (user && !loading) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
        return;
      }

      setProfile(data);
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          company_name: data.company_name || '',
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching profile:', error);
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
          date_of_birth: formData.date_of_birth ? formData.date_of_birth.toISOString().split('T')[0] : null,
        })
        .eq('id', user.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Profile updated successfully." });
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'distillery': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'investor': return 'bg-green-100 text-green-800 border-green-200';
      case 'consumer': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getVerificationColor = (status: string | null) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <SignInPrompt
        title="View Your Profile"
        description="Sign in to manage your account information and preferences."
      />
    );
  }

  if (loading || isLoading) {
    return (
      <div className="mobile-container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container space-y-6 pb-20 lg:pb-6">
      <div className="py-6">
        <div className="flex items-center gap-3">
          <AvatarUpload avatarUrl={avatarUrl} onUploaded={(url) => setAvatarUrl(url)} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account information</p>
          </div>
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
              <CardDescription>Your basic account details and verification status</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Read-only fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="text-sm font-medium bg-muted/50 px-3 py-2 rounded-md">{profile?.email}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded-md truncate">{profile?.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                <div>
                  <Badge className={getRoleColor(userRole || '')}>
                    {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
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
                    <Input id="first_name" value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} placeholder="Enter your first name" />
                  ) : (
                    <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{profile?.first_name || 'Not provided'}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditing ? (
                    <Input id="last_name" value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} placeholder="Enter your last name" />
                  ) : (
                    <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{profile?.last_name || 'Not provided'}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date_of_birth && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_of_birth ? format(formData.date_of_birth, "PPP") : <span>Pick your date of birth</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date_of_birth}
                        onSelect={(date) => setFormData(prev => ({ ...prev, date_of_birth: date }))}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">
                    {profile?.date_of_birth ? format(new Date(profile.date_of_birth), "PPP") : 'Not provided'}
                  </div>
                )}
              </div>

              {(userRole === 'distillery' || userRole === 'investor') && (
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  {isEditing ? (
                    <Input id="company_name" value={formData.company_name} onChange={(e) => handleInputChange('company_name', e.target.value)} placeholder="Enter your company name" />
                  ) : (
                    <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{profile?.company_name || 'Not provided'}</div>
                  )}
                </div>
              )}
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
                      date_of_birth: profile?.date_of_birth ? new Date(profile.date_of_birth) : undefined,
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
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
