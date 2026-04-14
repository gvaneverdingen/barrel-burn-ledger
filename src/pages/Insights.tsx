import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3, DollarSign, Activity, MapPin, Tag } from 'lucide-react';

interface InsightsData {
  activeListings: number;
  avgCaskValue: number;
  totalVolume: number;
  transactionCount: number;
  regionDistribution: Record<string, number>;
  priceDistribution: Record<string, number>;
}

const PRICE_BUCKETS = [
  { label: 'Under £5,000', min: 0, max: 5000 },
  { label: '£5,000 – £10,000', min: 5000, max: 10000 },
  { label: '£10,000 – £25,000', min: 10000, max: 25000 },
  { label: '£25,000 – £50,000', min: 25000, max: 50000 },
  { label: 'Over £50,000', min: 50000, max: Infinity },
];

const Insights = () => {
  const { formatPrice } = useCurrency();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const [casksRes, txRes] = await Promise.all([
          supabase
            .from('casks')
            .select('total_price, current_volume_liters, region')
            .eq('available_for_sale', true),
          supabase
            .from('transactions')
            .select('id', { count: 'exact', head: true }),
        ]);

        const casks = casksRes.data || [];
        const txCount = txRes.count || 0;

        const regionDist: Record<string, number> = {};
        const priceDist: Record<string, number> = {};
        PRICE_BUCKETS.forEach(b => (priceDist[b.label] = 0));

        let totalValue = 0;
        let totalVol = 0;

        casks.forEach(c => {
          const price = Number(c.total_price) || 0;
          totalValue += price;
          totalVol += Number(c.current_volume_liters) || 0;

          const region = c.region || 'Unknown';
          regionDist[region] = (regionDist[region] || 0) + 1;

          for (const b of PRICE_BUCKETS) {
            if (price >= b.min && price < b.max) {
              priceDist[b.label]++;
              break;
            }
          }
        });

        setData({
          activeListings: casks.length,
          avgCaskValue: casks.length > 0 ? totalValue / casks.length : 0,
          totalVolume: totalVol,
          transactionCount: txCount,
          regionDistribution: regionDist,
          priceDistribution: priceDist,
        });
      } catch (err) {
        console.error('Insights fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const maxRegion = data ? Math.max(...Object.values(data.regionDistribution), 1) : 1;
  const maxPrice = data ? Math.max(...Object.values(data.priceDistribution), 1) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold luxury-text-gradient mb-2">Market Insights</h2>
        <p className="text-muted-foreground">
          Live analytics from the Angel Share marketplace.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Active Listings', icon: BarChart3, value: data?.activeListings, format: (v: number) => v.toLocaleString() },
          { title: 'Avg Cask Value', icon: DollarSign, value: data?.avgCaskValue, format: (v: number) => formatPrice(v) },
          { title: 'Total Volume', icon: Activity, value: data?.totalVolume, format: (v: number) => `${v.toLocaleString()} L` },
          { title: 'Transactions', icon: TrendingUp, value: data?.transactionCount, format: (v: number) => v.toLocaleString() },
        ].map(({ title, icon: Icon, value, format }) => (
          <Card key={title} className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold text-primary">{format(value ?? 0)}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : data && Object.keys(data.regionDistribution).length > 0 ? (
              Object.entries(data.regionDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([region, count]) => (
                  <div key={region}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{region}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(count / maxRegion) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No regional data available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" /> Price Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : data ? (
              Object.entries(data.priceDistribution).map(([label, count]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{label}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${(count / maxPrice) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No price data available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
