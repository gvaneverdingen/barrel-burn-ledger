import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, DollarSign, TrendingUp, Warehouse, Building2 } from "lucide-react";
import { MetricsCards } from "@/components/admin/MetricsCards";
import { UserManagement } from "@/components/admin/UserManagement";
import { ListingsManagement } from "@/components/admin/ListingsManagement";
import { OrdersManagement } from "@/components/admin/OrdersManagement";
import DistilleryVerificationManagement from "@/components/admin/DistilleryVerificationManagement";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState({
    totalConsumers: 0,
    totalDistillers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeListings: 0,
    totalInventory: 0,
    platformFees: 0,
    distilleryFees: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch user counts by role
      const { data: consumers } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'consumer');

      const { data: distillers } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'distillery');

      // Fetch orders count and revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('total_amount, platform_fee, distillery_fee, status');

      const totalOrders = transactions?.length || 0;
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      const platformFees = transactions?.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0) || 0;
      const distilleryFees = transactions?.reduce((sum, t) => sum + Number(t.distillery_fee || 0), 0) || 0;
      const completedTransactions = transactions?.filter(t => t.status === 'completed').length || 0;
      const pendingTransactions = transactions?.filter(t => t.status === 'pending').length || 0;

      // Fetch active listings
      const { count: activeListings } = await supabase
        .from('cask_sales')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch total inventory
      const { data: casks } = await supabase
        .from('casks')
        .select('current_volume_liters');

      const totalInventory = casks?.reduce((sum, c) => sum + Number(c.current_volume_liters || 0), 0) || 0;

      setMetrics({
        totalConsumers: consumers?.length || 0,
        totalDistillers: distillers?.length || 0,
        totalOrders,
        totalRevenue,
        activeListings: activeListings || 0,
        totalInventory: Math.round(totalInventory),
        platformFees,
        distilleryFees,
        completedTransactions,
        pendingTransactions,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, listings, orders, and view platform metrics
        </p>
      </div>

      <MetricsCards metrics={metrics} loading={loading} />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="distilleries">Distilleries</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement onUpdate={fetchMetrics} />
        </TabsContent>

        <TabsContent value="distilleries" className="space-y-4">
          <DistilleryVerificationManagement />
        </TabsContent>

        <TabsContent value="listings" className="space-y-4">
          <ListingsManagement />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrdersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
