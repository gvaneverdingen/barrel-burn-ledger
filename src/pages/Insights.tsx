import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, BarChart3, DollarSign, Activity } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const Insights = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-dark">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SidebarTrigger />
                <h1 className="text-xl font-bold luxury-text-gradient">Market Insights</h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold luxury-text-gradient mb-4">Market Insights</h2>
              <p className="text-muted-foreground">
                Analyze market trends and performance metrics for whisky cask investments.
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="luxury-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Market Growth
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">+12.5%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Cask Value
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">£15,240</div>
                  <p className="text-xs text-muted-foreground">
                    +5.2% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Listings
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">2,847</div>
                  <p className="text-xs text-muted-foreground">
                    +180 new this week
                  </p>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Trading Volume
                  </CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">£2.1M</div>
                  <p className="text-xs text-muted-foreground">
                    +8.3% from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Coming Soon Section */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">Advanced Analytics Coming Soon</CardTitle>
                <CardDescription className="text-muted-foreground">
                  We're building comprehensive market insights including price trends, regional performance, 
                  age-based analytics, and investment recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Real-time price tracking and historical performance</div>
                  <div>• Regional market analysis and distillery comparisons</div>
                  <div>• Age-based maturation value projections</div>
                  <div>• Personalized investment recommendations</div>
                  <div>• Market sentiment analysis and trend predictions</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Insights;