import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

interface PortfolioValueChartProps {
  ownerships: Array<{
    acquired_date: string;
    acquisition_price: number;
    volume_liters: number;
    casks: {
      price_per_liter: number | null;
    };
  }>;
}

export const PortfolioValueChart = ({ ownerships }: PortfolioValueChartProps) => {
  const { formatPrice } = useCurrency();

  const chartData = useMemo(() => {
    if (ownerships.length === 0) return [];

    // Sort acquisitions by date
    const sorted = [...ownerships].sort(
      (a, b) => new Date(a.acquired_date).getTime() - new Date(b.acquired_date).getTime()
    );

    const points: ChartDataPoint[] = [];
    let cumulativeInvestment = 0;
    let cumulativeValue = 0;

    sorted.forEach((o) => {
      cumulativeInvestment += o.acquisition_price || 0;
      cumulativeValue += (o.casks?.price_per_liter ?? 0) * o.volume_liters;
      const d = new Date(o.acquired_date);
      points.push({
        date: o.acquired_date,
        value: cumulativeValue,
        label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      });
    });

    // Add "today" point with current values
    const totalCurrentValue = ownerships.reduce(
      (sum, o) => sum + (o.casks?.price_per_liter ?? 0) * o.volume_liters,
      0
    );
    points.push({
      date: new Date().toISOString(),
      value: totalCurrentValue,
      label: "Now",
    });

    return points;
  }, [ownerships]);

  if (ownerships.length === 0) return null;

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const minValue = Math.min(...chartData.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  // SVG chart dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = chartData.map((d, i) => {
    const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <Card className="luxury-card animate-scale-in" style={{ animationDelay: "0.35s" }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Portfolio Value Over Time
        </CardTitle>
        <span className="text-xs text-muted-foreground">{chartData.length} data points</span>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Gradient fill */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
              <text x={p.x} y={padding.top + chartHeight + 18} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
                {p.label}
              </text>
            </g>
          ))}

          {/* Value labels on first and last */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y={points[0].y - 10} textAnchor="start" className="fill-foreground" fontSize="11" fontWeight="600">
                {formatPrice(points[0].value)}
              </text>
              <text x={points[points.length - 1].x} y={points[points.length - 1].y - 10} textAnchor="end" className="fill-foreground" fontSize="11" fontWeight="600">
                {formatPrice(points[points.length - 1].value)}
              </text>
            </>
          )}
        </svg>
      </CardContent>
    </Card>
  );
};
