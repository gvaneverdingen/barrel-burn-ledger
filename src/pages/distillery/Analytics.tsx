import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DistilleryAnalytics = () => {
  const { user } = useAuth();

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

  const { data: transactions = [] } = useQuery({
    queryKey: ['distillery-transactions', distillery?.id],
    queryFn: async () => {
      if (!distillery) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          casks!inner (
            distillery_id
          )
        `)
        .eq('casks.distillery_id', distillery.id)
        .eq('status', 'completed');
      
      if (error) throw error;
      return data;
    },
    enabled: !!distillery,
  });

  const analytics = {
    totalSales: transactions.reduce((sum, t) => sum + t.total_amount, 0),
    totalTransactions: transactions.length,
    averageSalePrice: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.total_amount, 0) / transactions.length : 0,
    totalFees: transactions.reduce((sum, t) => sum + t.distillery_fee, 0),
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold luxury-text-gradient">Sales Analytics</h1>
        <p className="text-muted-foreground">Track your sales performance and revenue</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{analytics.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {analytics.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{analytics.averageSalePrice.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Paid</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{analytics.totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Distillery fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest completed sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Sales Yet</h3>
              <p className="text-muted-foreground">
                Once you make your first sale, analytics will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Transaction #{transaction.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">£{transaction.total_amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.volume_liters}L @ £{transaction.price_per_liter}/L
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DistilleryAnalytics;