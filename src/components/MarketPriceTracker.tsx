import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Search, TrendingUp, DollarSign, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MarketSummary {
  totalPrimaryCasks: number;
  totalSecondaryListings: number;
  avgPrimaryPrice: number;
  avgSecondaryPrice: number;
  avgROI: number;
}

export const MarketPriceTracker = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setAnalysis('');

    try {
      const { data, error } = await supabase.functions.invoke('search-market-prices', {
        body: { query },
      });

      if (error) {
        console.error('Edge function error:', error);
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits exhausted. Please contact support.');
        } else {
          toast.error('Failed to search market prices');
        }
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data.analysis);
      setMarketSummary(data.marketSummary);
      
      // Add to search history
      setSearchHistory(prev => [query, ...prev.filter(q => q !== query).slice(0, 4)]);
      
      toast.success('Market analysis complete!');
    } catch (err) {
      console.error('Search error:', err);
      toast.error('An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (quickQuery: string) => {
    setQuery(quickQuery);
  };

  const quickSearches = [
    'What are the best value scotch casks under £50 per liter?',
    'Show me casks with highest ROI in secondary market',
    'Compare prices between bourbon and scotch casks',
    'Which distilleries offer the most competitive prices?',
    'What is the average price for 10+ year old casks?',
  ];

  return (
    <div className="space-y-6">
      <Card className="heritage-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">AI Market Price Tracker</CardTitle>
              <CardDescription>
                Ask questions about cask market prices, trends, and investment opportunities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="e.g., What are the best value scotch casks?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 mobile-touch-target"
              disabled={loading}
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="heritage-button mobile-button-md"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Quick Search Suggestions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Quick searches:</p>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((qs, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors mobile-touch-target text-xs sm:text-sm"
                  onClick={() => handleQuickSearch(qs)}
                >
                  {qs.length > 50 ? qs.substring(0, 50) + '...' : qs}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((search, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors mobile-touch-target"
                    onClick={() => setQuery(search)}
                  >
                    {search.length > 40 ? search.substring(0, 40) + '...' : search}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Summary Cards */}
      {marketSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="heritage-card hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Primary Market</p>
              </div>
              <p className="text-2xl font-bold">{marketSummary.totalPrimaryCasks}</p>
              <p className="text-xs text-muted-foreground">Available casks</p>
            </CardContent>
          </Card>

          <Card className="heritage-card hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Secondary Market</p>
              </div>
              <p className="text-2xl font-bold">{marketSummary.totalSecondaryListings}</p>
              <p className="text-xs text-muted-foreground">Active listings</p>
            </CardContent>
          </Card>

          <Card className="heritage-card hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Avg Primary Price</p>
              </div>
              <p className="text-2xl font-bold">£{marketSummary.avgPrimaryPrice.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">per liter</p>
            </CardContent>
          </Card>

          <Card className="heritage-card hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-accent" />
                <p className="text-xs text-muted-foreground">Avg Secondary Price</p>
              </div>
              <p className="text-2xl font-bold">£{marketSummary.avgSecondaryPrice.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">per liter</p>
            </CardContent>
          </Card>

          <Card className="heritage-card hover-scale">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Avg ROI</p>
              </div>
              <p className={`text-2xl font-bold ${marketSummary.avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketSummary.avgROI.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Secondary market</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Analysis Results */}
      {loading && (
        <Card className="heritage-card">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/6" />
          </CardContent>
        </Card>
      )}

      {analysis && !loading && (
        <Card className="heritage-card animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <CardTitle>Market Analysis</CardTitle>
            </div>
            <CardDescription>AI-powered insights based on current market data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap mobile-body">{analysis}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <Card className="heritage-card border-dashed">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Ready to search market prices</h3>
            <p className="text-muted-foreground mb-4">
              Ask any question about cask prices, trends, or investment opportunities
            </p>
            <p className="text-sm text-muted-foreground">
              Try clicking one of the quick search suggestions above
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
