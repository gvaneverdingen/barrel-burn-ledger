import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { DollarSign, TrendingUp, TrendingDown, Package, Clock } from 'lucide-react';

interface PortfolioSummaryCardsProps {
  ownerships: Array<{
    acquisition_price: number;
    volume_liters: number;
    acquired_date: string;
    casks: {
      price_per_liter: number | null;
      distillation_date: string;
      expected_maturation_years: number | null;
    };
  }>;
}

export const PortfolioSummaryCards = ({ ownerships }: PortfolioSummaryCardsProps) => {
  const { formatPrice } = useCurrency();

  const totalInvested = ownerships.reduce((s, o) => s + (o.acquisition_price || 0), 0);
  const currentValue = ownerships.reduce(
    (s, o) => s + (o.casks?.price_per_liter ?? 0) * o.volume_liters,
    0
  );
  const roi = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  const isPositive = roi >= 0;

  // Maturation: average progress across casks
  const maturationData = ownerships
    .filter(o => o.casks?.expected_maturation_years && o.casks?.distillation_date)
    .map(o => {
      const distilled = new Date(o.casks.distillation_date);
      const ageYears = (Date.now() - distilled.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const expected = o.casks.expected_maturation_years!;
      return { progress: Math.min((ageYears / expected) * 100, 100), remaining: Math.max(expected - ageYears, 0) };
    });

  const avgMaturation = maturationData.length > 0
    ? maturationData.reduce((s, m) => s + m.progress, 0) / maturationData.length
    : 0;

  const avgRemaining = maturationData.length > 0
    ? maturationData.reduce((s, m) => s + m.remaining, 0) / maturationData.length
    : 0;

  const cards = [
    {
      title: 'Total Invested',
      icon: Package,
      value: formatPrice(totalInvested),
      sub: `${ownerships.length} cask${ownerships.length !== 1 ? 's' : ''}`,
      delay: '0.05s',
    },
    {
      title: 'Current Value',
      icon: DollarSign,
      value: formatPrice(currentValue),
      sub: 'Market valuation',
      delay: '0.1s',
    },
    {
      title: 'Overall ROI',
      icon: isPositive ? TrendingUp : TrendingDown,
      value: `${isPositive ? '+' : ''}${roi.toFixed(1)}%`,
      sub: `${formatPrice(Math.abs(currentValue - totalInvested))} ${isPositive ? 'gain' : 'loss'}`,
      badge: isPositive ? 'Profit' : 'Loss',
      badgeVariant: (isPositive ? 'default' : 'destructive') as 'default' | 'destructive',
      delay: '0.15s',
    },
    {
      title: 'Avg Maturation',
      icon: Clock,
      value: `${avgMaturation.toFixed(0)}%`,
      sub: avgRemaining > 0 ? `~${avgRemaining.toFixed(1)}y remaining` : 'Fully matured',
      delay: '0.2s',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, icon: Icon, value, sub, badge, badgeVariant, delay }) => (
        <Card
          key={title}
          className="luxury-card hover-scale animate-scale-in"
          style={{ animationDelay: delay }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold luxury-text-gradient">{value}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{sub}</p>
              {badge && <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">{badge}</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
