import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const DistilleryOnboarding = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    established_year: "",
    license_number: "",
    website: "",
  });

  // Check if user already has a distillery application
  const { data: existingDistillery, isLoading } = useQuery({
    queryKey: ['distillery-application', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('distilleries')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to apply");
      return;
    }

    if (!formData.name || !formData.location || !formData.license_number) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create distillery application
      const { data: distillery, error: distilleryError } = await supabase
        .from('distilleries')
        .insert({
          profile_id: user.id,
          name: formData.name,
          location: formData.location,
          description: formData.description || null,
          established_year: formData.established_year ? parseInt(formData.established_year) : null,
          license_number: formData.license_number,
          website: formData.website || null,
          verified: false, // Start as unverified
        })
        .select()
        .single();

      if (distilleryError) throw distilleryError;

      // Create notification for admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'administrator');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'distillery_application',
          title: 'New Distillery Application',
          message: `${formData.name} has applied for distillery verification.`,
          link: '/admin/dashboard',
          metadata: { distillery_id: distillery.id }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast.success("Application submitted successfully! We'll review it shortly.");
      navigate('/distillery/verification');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth guard
  if (!user) {
    return (
      <SignInPrompt
        title="Sign in to apply"
        description="You need to be signed in to submit a distillery application."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user already has a distillery application
  if (existingDistillery) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Application Already Submitted</h1>
          <p className="text-muted-foreground mb-6">
            You have already submitted a distillery application for <strong>{existingDistillery.name}</strong>.
            {existingDistillery.verified 
              ? " Your distillery is verified!"
              : " Your application is pending review."}
          </p>
          <Button onClick={() => navigate('/distillery')}>
            Go to Distillery Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // If user is already a distillery
  if (userRole === 'distillery') {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">You're Already a Distillery</h1>
          <p className="text-muted-foreground mb-6">
            Your account already has distillery access. Visit your dashboard to manage your casks.
          </p>
          <Button onClick={() => navigate('/distillery')}>
            Go to Distillery Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold luxury-text-gradient">Become a Distillery Partner</h1>
          <p className="text-muted-foreground mt-2">
            Join Angel Share and list your casks on our marketplace
          </p>
        </div>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle>Distillery Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply for a distillery account. 
              Our team will review your application within 2-3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Distillery Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Highland Springs Distillery"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Speyside, Scotland"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_number">Distillery License Number *</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    placeholder="e.g., AWRS-123456789"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="established_year">Year Established</Label>
                  <Input
                    id="established_year"
                    name="established_year"
                    type="number"
                    min="1700"
                    max={new Date().getFullYear()}
                    value={formData.established_year}
                    onChange={handleInputChange}
                    placeholder="e.g., 1890"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.yourdistillery.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">About Your Distillery</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about your distillery, its history, and what makes your spirits special..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Our team will review your application</li>
                  <li>• We may contact you to verify your license</li>
                  <li>• Once approved, you can start listing casks</li>
                  <li>• You'll gain access to the distillery dashboard</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="luxury-button">
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DistilleryOnboarding;
