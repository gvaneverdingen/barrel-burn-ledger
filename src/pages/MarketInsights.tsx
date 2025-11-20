import { MarketPriceTracker } from '@/components/MarketPriceTracker';
import { TrendingUp } from 'lucide-react';

const MarketInsights = () => {
  return (
    <div className="mobile-container space-y-6 pb-20 lg:pb-6">
      <div className="mobile-sticky-header py-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="mobile-heading font-bold">Market Insights</h1>
            <p className="mobile-body text-muted-foreground">
              AI-powered market price analysis and trends
            </p>
          </div>
        </div>
      </div>

      <MarketPriceTracker />
    </div>
  );
};

export default MarketInsights;
