import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const DistilleryVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: distillery } = useQuery({
    queryKey: ['distillery', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('distilleries')
        .select('*')
        .eq('profile_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getVerificationStatus = () => {
    if (!distillery) return { status: 'none', text: 'No Profile', color: 'secondary' };
    
    if (distillery.verified) {
      return { status: 'verified', text: 'Verified', color: 'default', icon: CheckCircle };
    }
    
    // If we have license_number, assume verification is pending
    if (distillery.license_number) {
      return { status: 'pending', text: 'Pending Review', color: 'secondary', icon: Clock };
    }
    
    return { status: 'incomplete', text: 'Incomplete', color: 'destructive', icon: AlertCircle };
  };

  const verificationStatus = getVerificationStatus();

  const requirements = [
    {
      title: "Distillery License",
      description: "Valid distillery license number",
      completed: !!distillery?.license_number,
      value: distillery?.license_number
    },
    {
      title: "Company Information",
      description: "Complete distillery profile with name and location",
      completed: !!(distillery?.name && distillery?.location),
      value: distillery?.name && distillery?.location ? `${distillery.name}, ${distillery.location}` : null
    },
    {
      title: "Established Year",
      description: "Year the distillery was established",
      completed: !!distillery?.established_year,
      value: distillery?.established_year
    },
    {
      title: "Contact Information",
      description: "Website or contact details",
      completed: !!distillery?.website,
      value: distillery?.website
    }
  ];

  if (!distillery) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">No Distillery Profile</h1>
          <p className="text-muted-foreground mb-6">
            You need to create a distillery profile before applying for verification.
          </p>
          <Button onClick={() => navigate('/profile')}>
            Create Distillery Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold luxury-text-gradient">Distillery Verification</h1>
          <p className="text-muted-foreground">Manage your verification status and requirements</p>
        </div>

        {/* Status Card */}
        <Card className="luxury-card mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <div>
                  <CardTitle>Verification Status</CardTitle>
                  <CardDescription>Your current verification level</CardDescription>
                </div>
              </div>
              <Badge 
                variant={verificationStatus.color as any}
                className="flex items-center gap-2"
              >
                {verificationStatus.icon && <verificationStatus.icon className="h-4 w-4" />}
                {verificationStatus.text}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {distillery.verified ? (
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">Congratulations!</h3>
                <p className="text-muted-foreground">
                  Your distillery has been verified. You can now list casks for sale on the marketplace.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-lg font-semibold mb-2">Verification in Progress</h3>
                  <p className="text-muted-foreground">
                    Complete all requirements below to submit your verification application.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle>Verification Requirements</CardTitle>
            <CardDescription>
              Complete all requirements to become a verified distillery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1">
                    {req.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{req.title}</h4>
                    <p className="text-sm text-muted-foreground">{req.description}</p>
                    {req.value && (
                      <p className="text-sm font-medium mt-1">{req.value}</p>
                    )}
                  </div>
                  <Badge variant={req.completed ? "default" : "secondary"}>
                    {req.completed ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex gap-4">
                <Button 
                  onClick={() => navigate('/profile')}
                  variant="outline"
                >
                  Update Profile
                </Button>
                <Button 
                  disabled={!requirements.every(req => req.completed) || distillery.verified}
                  className="luxury-button"
                >
                  {distillery.verified ? "Already Verified" : "Submit for Verification"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DistilleryVerification;