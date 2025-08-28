import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { User, ArrowRight } from 'lucide-react';

const ProfileCompletion = () => {
  const { user, userRole, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
  });

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
          // Profile exists, update it
          const { error } = await supabase
            .from('profiles')
            .update({
              first_name: formData.first_name.trim(),
              last_name: formData.last_name.trim(),
              company_name: formData.company_name.trim() || null,
            })
            .eq('id', existingProfile.id);

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
          // Profile doesn't exist, create it
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              first_name: formData.first_name.trim(),
              last_name: formData.last_name.trim(),
              company_name: formData.company_name.trim() || null,
              role: 'consumer' as any, // Cast to bypass TypeScript checking for enum
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
        description: "Welcome to ARIGI. Your profile has been completed successfully.",
      });

      // Refresh user data to update profile completion status
      await refreshUserData();
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
            Please provide your basic information to get started with ARIGI
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletion;