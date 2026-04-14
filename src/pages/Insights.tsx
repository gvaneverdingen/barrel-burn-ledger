import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignInPrompt } from "@/components/SignInPrompt";
import { TrendingUp, BarChart3, DollarSign, Activity, Package, Users } from "lucide-react";

const Insights = () => {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  const { data: casks } = useQuery({
    queryKey: ["insights-casks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("casks")
        .select("id, total_price, distillation_date, distillery_id, spirit_name, region, created_at")
        .eq("available_for_sale", true);
      return data || [];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["insights-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, total_amount, status, created_at, transaction_type")
        .eq("status", "completed");
      return data || [];
    },
  });

  const { data: salesListings } = useQuery({
    queryKey: ["insights-sales"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cask_sales")
        .select("id, total_asking_price, status, created_at")
        .eq("status", "active");
      return data || [];
    },
  });

  const totalListings = (casks?.length || 0) + (salesListings?.length || 0);
  const avgCaskValue = casks && casks.length > 0
    ? casks.reduce((sum, c) => sum + (Number(c.total_price) || 0), 0) / casks.length
    : 0;
  const totalVolume = transactions?.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0) || 0;
  const completedTx = transactions?.length || 0;

  // Price distribution buckets
  const priceBuckets = { "< £5k": 0, "£5k–£15k": 0, "£15k–£30k": 0, "£30k+": 0 };
  casks?.forEach((c) => {
    const p = Number(c.total_price) || 0;
    if (p < 5000) priceBuckets["< £5k"]++;
    else if (p < 15000) priceBuckets["£5k–£15k"]++;
    else if (p < 30000) priceBuckets["£15k–£30k"]++;
    else priceBuckets["£30k+"]++;
  });
  const maxBucket = Math.max(...Object.values(priceBuckets), 1);

  // Monthly transaction volume (last 6 months)
  const monthlyVolume: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("en-GB", { month: "short" });
    const year = d.getFullYear();
    const month = d.getMonth();
    const amount = transactions
      ?.filter((t) => {
        const td = new Date(t.created_at);
        return td.getFullYear() === year && td.getMonth() === month;
      })
      .reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0) || 0;
    monthlyVolume.push({ label, amount });
  }
  const maxMonthly = Math.max(...monthlyVolume.map((m) => m.amount), 1);

  // Region distribution
  const regionCounts: Record<string, number> = {};
  casks?.forEach((c) => {
    const region = c.region || "Unknown";
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });
  const topRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxRegion = Math.max(...topRegions.map(([, v]) => v), 1);

  return (
    <div className="mobile-container space-y-6 pb-20 lg:pb-6">
      <div className="py-6">
        <h1 className="text-xl sm:text-2xl font-bold luxury-text-gradient">Market Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live analytics from the Angel Share marketplace
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" /> Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{totalListings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Avg Cask Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{formatPrice(avgCaskValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" /> Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{formatPrice(totalVolume)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Completed Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{completedTx}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trading Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Monthly Trading Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {monthlyVolume.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/80 rounded-t-sm transition-all"
                    style={{ height: `${Math.max((m.amount / maxMonthly) * 120, 4)}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent" />
              Price Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(priceBuckets).map(([label, count]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-6 bg-muted/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-accent/70 rounded-sm transition-all"
                      style={{ width: `${(count / maxBucket) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Region Breakdown */}
      {topRegions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" />
              Listings by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topRegions.map(([region, count]) => (
                <div key={region} className="flex items-center gap-2">
                  <div
                    className="h-3 bg-secondary/60 rounded-sm"
                    style={{ width: `${(count / maxRegion) * 60}px` }}
                  />
                  <span className="text-xs font-medium">{region}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Insights;
