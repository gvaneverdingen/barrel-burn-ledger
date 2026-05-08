import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Package, BarChart3, Shield, Plus, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const WarehouseDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userRole === "administrator";

  const { data: warehouse } = useQuery({
    queryKey: ["warehouse", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("warehouses").select("*").eq("profile_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isAdmin,
  });

  const { data: casks } = useQuery({
    queryKey: ["warehouse-casks", warehouse?.id],
    queryFn: async () => {
      if (!warehouse) return [];
      const { data, error } = await supabase.from("casks").select("*").eq("warehouse_id", warehouse.id);
      if (error) throw error;
      return data;
    },
    enabled: !!warehouse,
  });

  const stats = {
    totalCasks: casks?.length || 0,
    available: casks?.filter((c) => c.available_for_sale).length || 0,
    totalVolume: casks?.reduce((s, c) => s + (Number(c.current_volume_liters) || 0), 0) || 0,
  };

  if (!isAdmin && !warehouse) {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <Warehouse className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">No Warehouse Profile</h1>
        <p className="text-muted-foreground mb-6">Apply to become a bonded warehouse partner to access this dashboard.</p>
        <Button onClick={() => navigate("/warehouse/onboarding")}>Apply to Become a Warehouse</Button>
      </div>
    );
  }

  if (!warehouse) return null;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="flex items-center gap-2">
            <Home className="h-4 w-4" /> Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold luxury-text-gradient">{warehouse.name}</h1>
            <p className="text-muted-foreground">{warehouse.location}{warehouse.country ? `, ${warehouse.country}` : ""}</p>
          </div>
        </div>
        {warehouse.verified ? (
          <Badge variant="default" className="bg-green-500"><Shield className="h-4 w-4 mr-1" />Verified</Badge>
        ) : (
          <Badge variant="secondary"><Shield className="h-4 w-4 mr-1" />Pending Verification</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Casks</CardTitle><Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalCasks}</div></CardContent>
        </Card>
        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Sale</CardTitle><BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.available}</div></CardContent>
        </Card>
        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume (L)</CardTitle><Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalVolume.toFixed(0)}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="luxury-card cursor-pointer hover:shadow-gold transition-all" onClick={() => navigate("/warehouse/casks/new")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Cask</CardTitle>
            <CardDescription>List a cask held under bond</CardDescription>
          </CardHeader>
        </Card>
        <Card className="luxury-card cursor-pointer hover:shadow-gold transition-all" onClick={() => navigate("/warehouse/verification")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Verification</CardTitle>
            <CardDescription>Manage verification status</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default WarehouseDashboard;