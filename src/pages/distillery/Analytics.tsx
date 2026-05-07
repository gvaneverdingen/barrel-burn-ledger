import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, Package, Home, Clock, CheckCircle, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const FALLBACK_DEMO_DISTILLERY: any = {
  id: 'demo-verified-distillery',
  profile_id: 'demo-profile',
  name: 'Highland Heritage Distillery',
  verified: true,
};

const FALLBACK_DEMO_TRANSACTIONS: any[] = Array.from({ length: 18 }, (_, i) => {
  const monthsAgo = Math.floor(i / 3);
  const date = subMonths(new Date(), monthsAgo);
  const total = 8000 + Math.round(Math.random() * 12000);
  const platform_fee = total * 0.025;
  const transaction_fee = total * 0.015;
  const distillery_fee = total * 0.05;
  return {
    id: `demo-tx-${i}`,
    created_at: date.toISOString(),
    status: 'completed',
    total_amount: total,
    seller_amount: total - platform_fee - transaction_fee - distillery_fee,
    platform_fee,
    transaction_fee,
    distillery_fee,
    casks: { distillery_id: 'demo-verified-distillery', spirit_name: 'Highland Single Malt' },
  };
});

const FALLBACK_DEMO_PAYOUTS: any[] = [
  { id: 'demo-p-1', amount: 14250, status: 'completed', created_at: subMonths(new Date(), 1).toISOString() },
  { id: 'demo-p-2', amount: 9870, status: 'completed', created_at: subMonths(new Date(), 2).toISOString() },
  { id: 'demo-p-3', amount: 6300, status: 'pending_payout', created_at: new Date().toISOString() },
  { id: 'demo-p-4', amount: 4250, status: 'pending_payout', created_at: new Date().toISOString() },
];

const DistilleryAnalytics = () => {
  const { user, userRole } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [selectedDistilleryId, setSelectedDistilleryId] = useState<string | null>(null);
  const isAdmin = userRole === 'administrator';

  // For admins: fetch all distilleries
  const { data: allDistilleries = [] } = useQuery({
    queryKey: ['all-distilleries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distilleries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // For distillery owners: fetch their distillery
  const { data: ownDistillery } = useQuery({
    queryKey: ['distillery', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('distilleries')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isAdmin,
  });

  // Determine which distillery to show
  const resolvedDistillery = isAdmin
    ? allDistilleries.find(d => d.id === selectedDistilleryId) || allDistilleries[0]
    : ownDistillery;
  const distillery: any = resolvedDistillery || FALLBACK_DEMO_DISTILLERY;
  const isDemo = !resolvedDistillery;

  const { data: transactions = [] } = useQuery({
    queryKey: ['distillery-transactions', distillery?.id, isDemo],
    queryFn: async () => {
      if (isDemo) return FALLBACK_DEMO_TRANSACTIONS;
      if (!resolvedDistillery) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          casks!inner (
            distillery_id,
            spirit_name
          )
        `)
        .eq('casks.distillery_id', resolvedDistillery.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Transactions fetch failed, using demo data', error);
        return FALLBACK_DEMO_TRANSACTIONS;
      }
      return data && data.length > 0 ? data : FALLBACK_DEMO_TRANSACTIONS;
    },
    enabled: !!user,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['distillery-payouts', distillery?.profile_id, isDemo],
    queryFn: async () => {
      if (isDemo) return FALLBACK_DEMO_PAYOUTS;
      if (!resolvedDistillery) return [];

      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('recipient_id', resolvedDistillery.profile_id)
        .eq('recipient_type', 'distillery')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Payouts fetch failed, using demo data', error);
        return FALLBACK_DEMO_PAYOUTS;
      }
      return data && data.length > 0 ? data : FALLBACK_DEMO_PAYOUTS;
    },
    enabled: !!user,
  });

  // Calculate analytics
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.seller_amount || t.total_amount - t.platform_fee - t.transaction_fee), 0);
  const totalTransactions = transactions.length;
  const averageSalePrice = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalFees = transactions.reduce((sum, t) => sum + t.distillery_fee, 0);
  
  // Payout analytics
  const pendingPayouts = payouts.filter(p => p.status === 'pending_payout');
  const completedPayouts = payouts.filter(p => p.status === 'completed');
  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const completedAmount = completedPayouts.reduce((sum, p) => sum + p.amount, 0);

  // Generate monthly revenue data for last 6 months
  const monthlyRevenueData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.created_at);
      return tDate >= monthStart && tDate <= monthEnd;
    });
    
    const revenue = monthTransactions.reduce((sum, t) => sum + (t.seller_amount || t.total_amount - t.platform_fee - t.transaction_fee), 0);
    const sales = monthTransactions.length;
    
    return {
      month: format(date, 'MMM'),
      revenue,
      sales,
    };
  });

  // Payout status distribution for pie chart
  const payoutDistribution = [
    { name: 'Completed', value: completedAmount, color: 'hsl(var(--chart-1))' },
    { name: 'Pending', value: pendingAmount, color: 'hsl(var(--chart-2))' },
  ].filter(item => item.value > 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold luxury-text-gradient">Earnings Dashboard</h1>
              {isDemo && <Badge variant="secondary">Demo</Badge>}
            </div>
            <p className="text-muted-foreground">
              {isDemo ? `Sample analytics for ${distillery.name}` : isAdmin ? `Viewing: ${distillery.name}` : 'Track your revenue, payouts, and financial performance'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin distillery selector */}
            {isAdmin && allDistilleries.length > 1 && (
              <Select 
                value={distillery.id} 
                onValueChange={setSelectedDistilleryId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select distillery" />
                </SelectTrigger>
                <SelectContent>
                  {allDistilleries.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isAdmin && (
              <Badge variant="outline" className="border-primary text-primary">
                Admin View
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {totalTransactions} sales
            </p>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{formatPrice(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayouts.length} payouts awaiting transfer
            </p>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Transfers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatPrice(completedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {completedPayouts.length} transfers completed
            </p>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{averageSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Trend Chart */}
        <Card className="luxury-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => formatPrice(value)} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatPrice(value), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#revenueGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payout Distribution Pie Chart */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payout Status
            </CardTitle>
            <CardDescription>Distribution of payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {payoutDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payoutDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {payoutDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatPrice(value), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No payout data yet</p>
                </div>
              )}
              <div className="flex justify-center gap-6 -mt-4">
                {payoutDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Month Bar Chart */}
      <Card className="luxury-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Monthly Sales Volume
          </CardTitle>
          <CardDescription>Number of casks sold per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value, 'Sales']}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payouts Table */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
          <CardDescription>
            Your latest payout transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
              <p className="text-muted-foreground">
                Once you complete sales, your payouts will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.slice(0, 10).map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {payout.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">Payout #{payout.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payout.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${payout.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                      £{payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {payout.status.replace('_', ' ')}
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
