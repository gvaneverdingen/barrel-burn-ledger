import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StripeConnectStatus {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
}

const StripeConnectCard = () => {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading, refetch } = useQuery<StripeConnectStatus>({
    queryKey: ['stripe-connect-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-connect-status');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: {
          returnUrl: `${window.location.origin}/distillery`,
          refreshUrl: `${window.location.origin}/distillery`,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      setIsConnecting(false);
      toast.error(error.message || "Failed to start Stripe Connect onboarding");
    },
  });

  const getStatusBadge = () => {
    if (!status?.connected) {
      return <Badge variant="secondary">Not Connected</Badge>;
    }
    if (!status.onboardingComplete) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending Setup</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="luxury-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>Receive payouts directly to your bank account</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {!status?.connected ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Why connect Stripe?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Receive payouts directly to your bank account</li>
                <li>• Automatic transfers when casks are sold</li>
                <li>• Track your earnings in the Stripe dashboard</li>
                <li>• Secure, industry-standard payment processing</li>
              </ul>
            </div>
            <Button 
              onClick={() => connectMutation.mutate()}
              disabled={isConnecting || connectMutation.isPending}
              className="w-full"
            >
              {isConnecting || connectMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Connect with Stripe
                </>
              )}
            </Button>
          </div>
        ) : !status.onboardingComplete ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-600">Complete Your Setup</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You've started connecting your Stripe account, but there are additional steps to complete before you can receive payouts.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {status.chargesEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <span>Charges {status.chargesEnabled ? "Enabled" : "Pending"}</span>
              </div>
              <div className="flex items-center gap-2">
                {status.payoutsEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <span>Payouts {status.payoutsEnabled ? "Enabled" : "Pending"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="flex-1"
              >
                {connectMutation.isPending ? "Loading..." : "Continue Setup"}
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-600">Account Active</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your Stripe Connect account is fully set up. You'll receive payouts automatically when your casks are sold.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Charges Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Payouts Enabled</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.open('https://dashboard.stripe.com/connect/accounts/overview', '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Stripe Dashboard
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeConnectCard;
