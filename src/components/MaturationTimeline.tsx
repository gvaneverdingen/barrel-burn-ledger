import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Wine } from 'lucide-react';

interface MaturationTimelineProps {
  ownerships: Array<{
    casks: {
      spirit_name: string;
      cask_number: string;
      distillation_date: string;
      expected_maturation_years: number | null;
    };
  }>;
}

export const MaturationTimeline = ({ ownerships }: MaturationTimelineProps) => {
  const items = ownerships
    .filter(o => o.casks?.expected_maturation_years && o.casks?.distillation_date)
    .map(o => {
      const distilled = new Date(o.casks.distillation_date);
      const ageYears = (Date.now() - distilled.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const expected = o.casks.expected_maturation_years!;
      const progress = Math.min((ageYears / expected) * 100, 100);
      const remaining = Math.max(expected - ageYears, 0);
      const peakDate = new Date(distilled.getTime() + expected * 365.25 * 24 * 60 * 60 * 1000);

      return {
        name: o.casks.spirit_name,
        caskNumber: o.casks.cask_number,
        progress,
        ageYears: ageYears.toFixed(1),
        remaining: remaining.toFixed(1),
        peakDate,
        isMature: progress >= 100,
      };
    })
    .sort((a, b) => a.progress - b.progress);

  if (items.length === 0) return null;

  return (
    <Card className="luxury-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Maturation Timeline
        </CardTitle>
        <span className="text-xs text-muted-foreground">{items.length} casks</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.caskNumber} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Wine className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">{item.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">#{item.caskNumber}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {item.isMature ? 'Mature' : `${item.remaining}y left`}
              </span>
            </div>
            <Progress value={item.progress} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{item.ageYears}y aged</span>
              <span>Peak: {item.peakDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
