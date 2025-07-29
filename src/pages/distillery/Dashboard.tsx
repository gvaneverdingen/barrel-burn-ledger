import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Package, BarChart3, Shield, Plus, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const DistilleryDashboard = () => {
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

  const { data: casks } = useQuery({
    queryKey: ['distillery-casks', distillery?.id],
    queryFn: async () => {
      if (!distillery) return [];
      
      const { data, error } = await supabase
        .from('casks')
        .select('*')
        .eq('distillery_id', distillery.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!distillery,
  });

  const stats = {
    totalCasks: casks?.length || 0,
    availableCasks: casks?.filter(c => c.available_for_sale).length || 0,
    totalVolume: casks?.reduce((sum, c) => sum + (c.current_volume_liters || 0), 0) || 0,
  };

  if (!distillery) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">No Distillery Profile</h1>
          <p className="text-muted-foreground mb-6">
            You need to create a distillery profile to access this dashboard.
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold luxury-text-gradient">{distillery.name}</h1>
            <p className="text-muted-foreground">{distillery.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {distillery.verified ? (
            <Badge variant="default" className="bg-green-500">
              <Shield className="h-4 w-4 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Shield className="h-4 w-4 mr-1" />
              Pending Verification
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Casks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCasks}</div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Sale</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableCasks}</div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume (L)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="luxury-card cursor-pointer hover:shadow-gold transition-all" onClick={() => navigate('/distillery/casks')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Casks
            </CardTitle>
            <CardDescription>
              View and manage your cask inventory
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="luxury-card cursor-pointer hover:shadow-gold transition-all" onClick={() => navigate('/distillery/analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Analytics
            </CardTitle>
            <CardDescription>
              Track your sales performance
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="luxury-card cursor-pointer hover:shadow-gold transition-all" onClick={() => navigate('/distillery/verification')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification
            </CardTitle>
            <CardDescription>
              Manage verification status
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="luxury-card cursor-pointer hover:shadow-gold transition-all" onClick={() => navigate('/distillery/casks/new')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Cask
            </CardTitle>
            <CardDescription>
              List a new cask for sale
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default DistilleryDashboard;