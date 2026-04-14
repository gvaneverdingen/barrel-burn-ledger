import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, BarChart3, DollarSign, Activity, MapPin, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Metrics {
  activeListings: number;
  avgCaskValue: number;
  totalVolume: number;
  totalTransactions: number;
}

interface RegionData {
  region: string;
  count: number;
}

interface PriceBucket {
  label: string;
  count: number;
  min: number;
}

const PRICE_BUCKETS = [
  { label: 'Under £10k', max: 10000, min: 0 },
  { label: '£10k–50k', max: 50000, min: 10000 },
  { label: '£50k–100k', max: 100000, min: 50000 },
  { label: '£100k–250k', max: 250000, min: 100000 },
  { label: '£250k+', max: Infinity, min: 250000 },
];

const Insights = () => {
  const { formatPrice } = useCurrency();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [priceDist, setPriceDist] = useState<PriceBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch all available casks for aggregation
      const { data: casks } = await supabase
        .from('casks')
        .select('total_price, current_volume_liters, region')
        .eq('available_for_sale', true);

      const { count: txCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true });

      if (casks) {
        const total = casks.length;
        const avgPrice = total > 0
          ? casks.reduce((s, c) => s + (c.total_price || 0), 0) / total
          : 0;
        const totalVol = casks.reduce((s, c) => s + (c.current_volume_liters || 0), 0);

        setMetrics({
          activeListings: total,
          avgCaskValue: Math.round(avgPrice),
          totalVolume: Math.round(totalVol),
          totalTransactions: txCount || 0,
        });

        // Region breakdown
        const regionMap: Record<string, number> = {};
        casks.forEach((c) => {
          const r = c.region || 'Unknown';
          regionMap[r] = (regionMap[r] || 0) + 1;
        });
        const regionArr = Object.entries(regionMap)
          .map(([region, count]) => ({ region, count }))
          .sort((a, b) => b.count - a.count);
        setRegions(regionArr);

        // Price distribution
        const buckets = PRICE_BUCKETS.map((b) => ({
          label: b.label,
          min: b.min,
          count: casks.filter((c) => {
            const p = c.total_price || 0;
            return p >= b.min && p < b.max;
          }).length,
        }));
        setPriceDist(buckets);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const maxRegionCount = Math.max(...regions.map((r) => r.count), 1);
  const maxPriceCount = Math.max(...priceDist.map((b) => b.count), 1);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold heritage-text-gradient mb-2">Market Insights</h2>
        <p className="text-muted-foreground">
          Live analytics from the Angel Share marketplace.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Active Listings
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{metrics?.activeListings ?? 0}</div>
            <p className="text-xs text-muted-foreground">casks for sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Average Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatPrice(metrics?.avgCaskValue ?? 0)}</div>
            <p className="text-xs text-muted-foreground">per cask</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Volume
            </CardTitle>
            <Activity className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{metrics?.totalVolume?.toLocaleString() ?? 0}L</div>
            <p className="text-xs text-muted-foreground">across all listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{metrics?.totalTransactions ?? 0}</div>
            <p className="text-xs text-muted-foreground">completed trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Regional Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Regional Distribution
            </CardTitle>
            <CardDescription>Available casks by region</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {regions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No regional data available.</p>
            ) : (
              regions.map((r) => (
                <div key={r.region}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{r.region}</span>
                    <span className="text-muted-foreground">{r.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(r.count / maxRegionCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-accent" />
              Price Distribution
            </CardTitle>
            <CardDescription>Number of casks by price range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {priceDist.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{b.label}</span>
                  <span className="text-muted-foreground">{b.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(b.count / maxPriceCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
