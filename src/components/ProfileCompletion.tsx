import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { User, ArrowRight } from 'lucide-react';

const ProfileCompletion = () => {
  const { user, userRole, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
  });

  // Check if profile is already complete on component mount
  React.useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;
      
      try {
        console.log('🔍 ProfileCompletion: Checking existing profile for user:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, company_name')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log('🔍 ProfileCompletion: Existing profile check:', { profile, error });
        
        if (profile) {
          const isComplete = !!(profile.first_name && profile.last_name);
          console.log('🔍 ProfileCompletion: Profile completeness:', {
            first_name: profile.first_name,
            last_name: profile.last_name,
            isComplete
          });
          
          if (isComplete) {
            console.log('🟢 ProfileCompletion: Profile is already complete, should refresh auth state');
            // Profile is complete, refresh auth state and navigate
            await refreshUserData();
            setTimeout(() => navigate('/'), 100);
            return;
          }

          // Pre-fill form with existing data
          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            company_name: profile.company_name || '',
          });
        }
      } catch (error) {
        console.error('🔴 ProfileCompletion: Error checking existing profile:', error);
      }
    };

    checkExistingProfile();
  }, [user, refreshUserData, navigate]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 ProfileCompletion: Manual refresh triggered');
      await refreshUserData();
      toast({
        title: "Profile Refreshed",
        description: "Profile data has been refreshed",
      });
    } catch (error) {
      console.error('🔴 ProfileCompletion: Manual refresh error:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh profile data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both first and last name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('ProfileCompletion: Attempting to update profile for user:', user.id);
      console.log('ProfileCompletion: Form data:', formData);
      
      // For Magic wallet users, we need to handle profile creation/update differently
      if (user.user_metadata?.wallet_address) {
        console.log('ProfileCompletion: Magic wallet user detected, using upsert');
        
        // Check if profile exists by ID or email
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id, email')
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (checkError) {
          console.error('ProfileCompletion: Error checking existing profile:', checkError);
          toast({
            title: "Error",
            description: `Error checking profile: ${checkError.message}`,
            variant: "destructive",
          });
          return;
        }

        if (existingProfile) {
          // Check if this is the same user or a different user with same email
          if (existingProfile.id === user.id) {
            // Profile exists for this Magic wallet user, update it
            const { error } = await supabase
              .from('profiles')
              .update({
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                company_name: formData.company_name.trim() || null,
              })
              .eq('id', user.id);

            if (error) {
              console.error('ProfileCompletion: Error updating Magic user profile:', error);
              toast({
                title: "Error",
                description: `Failed to complete profile: ${error.message}`,
                variant: "destructive",
              });
              return;
            }
          } else {
            // Email already exists for a different user
            toast({
              title: "Email Already Taken",
              description: "This email address is already associated with another account. Please use a different email address with your Magic wallet.",
              variant: "destructive",
            });
            return;
          }
        } else {
          // Profile doesn't exist, create it
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              first_name: formData.first_name.trim(),
              last_name: formData.last_name.trim(),
              company_name: formData.company_name.trim() || null,
            });

          if (error) {
            console.error('ProfileCompletion: Error creating Magic user profile:', error);
            toast({
              title: "Error",
              description: `Failed to complete profile: ${error.message}`,
              variant: "destructive",
            });
            return;
          }
        }
      } else {
        // Regular Supabase auth users
        console.log('ProfileCompletion: Regular Supabase user, using update');
        
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            company_name: formData.company_name.trim() || null,
          })
          .eq('id', user.id);

        if (error) {
          console.error('ProfileCompletion: Error updating profile:', error);
          toast({
            title: "Error",
            description: `Failed to complete profile: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
      }

      console.log('ProfileCompletion: Profile update successful');
      toast({
        title: "Profile Complete!",
        description: "Welcome to Angel Share. Your profile has been completed successfully.",
      });

      // Refresh user data to update profile completion status
      console.log('ProfileCompletion: Calling refreshUserData...');
      await refreshUserData();
      
      // Wait a bit longer to ensure state has propagated
      console.log('ProfileCompletion: Waiting for state update before navigation...');
      setTimeout(() => {
        console.log('ProfileCompletion: Navigating to homepage...');
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('ProfileCompletion: Unexpected error completing profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide your basic information to get started with Angel Share
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>

            {(userRole === 'distillery' || userRole === 'investor') && (
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading}
            >
              {loading ? (
                'Completing Profile...'
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={refreshing}
              onClick={handleManualRefresh}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Profile Status'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletion;