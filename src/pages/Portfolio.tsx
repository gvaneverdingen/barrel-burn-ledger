import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Package, DollarSign, Calendar, MapPin, ShoppingCart, X, Store } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SellCaskDialog } from "@/components/SellCaskDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CaskOwnership {
  id: string;
  ownership_percentage: number;
  volume_liters: number;
  acquired_date: string;
  acquisition_price: number;
  casks: {
    id: string;
    spirit_name: string;
    cask_number: string;
    distillation_date: string;
    current_volume_liters: number;
    alcohol_percentage: number;
    price_per_liter: number;
    total_price: number;
    warehouse_location: string;
    tasting_notes: string;
    expected_maturation_years: number;
    distilleries: {
      name: string;
      location: string;
    };
    cask_types: {
      name: string;
      capacity_liters: number;
    };
  };
}

interface Transaction {
  id: string;
  transaction_type: string;
  total_amount: number;
  volume_liters: number;
  price_per_liter: number;
  status: string;
  created_at: string;
  completed_at: string;
  casks: {
    spirit_name: string;
    cask_number: string;
    distilleries: {
      name: string;
    };
  };
}

interface CaskSale {
  id: string;
  asking_price_per_liter: number;
  total_asking_price: number;
  volume_for_sale_liters: number;
  listing_date: string;
  expires_at: string;
  status: string;
  notes: string;
  cask_ownership: {
    id: string;
    ownership_percentage: number;
    volume_liters: number;
    acquired_date: string;
    acquisition_price: number;
    casks: {
      spirit_name: string;
      cask_number: string;
      distilleries: {
        name: string;
        location: string;
      };
      cask_types: {
        name: string;
        capacity_liters: number;
      };
    };
  };
}

const Portfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ownerships, setOwnerships] = useState<CaskOwnership[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeSales, setActiveSales] = useState<CaskSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedOwnership, setSelectedOwnership] = useState<CaskOwnership | null>(null);

  // Add immediate debug logging
  console.log("=== PORTFOLIO COMPONENT RENDER ===");
  console.log("User object:", user);
  console.log("User ID:", user?.id);
  console.log("User email:", user?.email);
  console.log("Is user truthy:", !!user);
  
  // Force render this info on screen for debugging
  const debugInfo = `User ID: ${user?.id || 'null'}, Email: ${user?.email || 'null'}`;

  useEffect(() => {
    if (user?.id) { // Check for user.id specifically, not just user
      fetchPortfolioData();
    } else {
      setLoading(false);
      setOwnerships([]);
      setTransactions([]);
    }
  }, [user?.id]); // Depend on user.id specifically

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setError("Please log in to view your portfolio");
        setLoading(false);
        return;
      }

      // Fetch ownership data
      const { data: ownershipData, error: ownershipError } = await supabase
        .from("cask_ownership")
        .select(`
          *,
          casks (
            id,
            spirit_name,
            cask_number,
            distillation_date,
            current_volume_liters,
            alcohol_percentage,
            price_per_liter,
            total_price,
            warehouse_location,
            tasting_notes,
            expected_maturation_years,
            distilleries (
              name,
              location
            ),
            cask_types (
              name,
              capacity_liters
            )
          )
        `)
        .eq("owner_id", user?.id)
        .eq("is_active", true);

      if (ownershipError) throw ownershipError;

      // Fetch transaction history
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select(`
          *,
          casks (
            spirit_name,
            cask_number,
            distilleries (name)
          )
        `)
        .eq("buyer_id", user?.id)
        .order("created_at", { ascending: false });

      if (transactionError) throw transactionError;

      // Fetch active sales listings
      const { data: salesData, error: salesError } = await supabase
        .from("cask_sales")
        .select(`
          *,
          cask_ownership (
            *,
            casks (
              spirit_name,
              cask_number,
              distilleries (name, location),
              cask_types (name, capacity_liters)
            )
          )
        `)
        .eq("seller_id", user?.id)
        .eq("status", "active")
        .order("listing_date", { ascending: false });

      if (salesError) throw salesError;

      setOwnerships(ownershipData || []);
      setTransactions(transactionData || []);
      setActiveSales(salesData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSellCask = (ownership: CaskOwnership) => {
    setSelectedOwnership(ownership);
    setSellDialogOpen(true);
  };

  const handleCancelSale = async (saleId: string) => {
    try {
      const { error } = await supabase
        .from("cask_sales")
        .update({ status: "cancelled" })
        .eq("id", saleId)
        .eq("seller_id", user?.id);

      if (error) throw error;

      toast({
        title: "Sale Cancelled",
        description: "Your cask listing has been removed from the marketplace",
      });

      fetchPortfolioData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel sale",
        variant: "destructive",
      });
    }
  };

  const isOwnershipForSale = (ownershipId: string) => {
    return activeSales.some(sale => sale.cask_ownership.id === ownershipId);
  };

  const calculatePortfolioValue = () => {
    return ownerships.reduce((total, ownership) => {
      const currentValue = ownership.casks.price_per_liter * ownership.volume_liters;
      return total + currentValue;
    }, 0);
  };

  const calculateTotalInvestment = () => {
    return ownerships.reduce((total, ownership) => {
      return total + (ownership.acquisition_price || 0);
    }, 0);
  };

  const calculateROI = () => {
    const investment = calculateTotalInvestment();
    const currentValue = calculatePortfolioValue();
    if (investment === 0) return 0;
    return ((currentValue - investment) / investment) * 100;
  };

  const getMaturityProgress = (distillationDate: string, expectedYears: number) => {
    const distilled = new Date(distillationDate);
    const now = new Date();
    const ageInYears = (now.getTime() - distilled.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.min((ageInYears / expectedYears) * 100, 100);
  };

  if (!user) {
    console.log("=== NO USER - SHOWING LOGIN MESSAGE ===");
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1">
            <header className="h-16 border-b flex items-center px-6">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold ml-4">Portfolio</h1>
            </header>
            <div className="p-6">
              <Alert>
                <AlertDescription>Please log in to view your portfolio. Current user: {JSON.stringify(user)}</AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 luxury-hero-bg">
          <header className="h-16 border-b backdrop-blur-sm bg-background/80 flex items-center px-6 sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-3xl font-bold ml-4 luxury-text-gradient">Portfolio</h1>
          </header>
          
          <div className="p-6 space-y-8 animate-fade-in">
            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="luxury-card animate-scale-in hover-scale" style={{ animationDelay: `${i * 0.1}s` }}>
                      <CardHeader>
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="luxury-card animate-scale-in">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Portfolio Hero Section */}
                <div className="text-center space-y-4 py-8">
                  <h2 className="text-4xl font-bold luxury-text-gradient">Your Investment Portfolio</h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Track your premium cask investments and watch your whisky mature into liquid gold
                  </p>
                </div>

                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="luxury-card hover-scale animate-scale-in group cursor-pointer" style={{ animationDelay: '0.1s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
                      <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold luxury-text-gradient">
                        ${calculatePortfolioValue().toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Current market value</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="luxury-card hover-scale animate-scale-in group cursor-pointer" style={{ animationDelay: '0.2s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Investment</CardTitle>
                      <div className="p-2 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                        <Package className="h-5 w-5 text-secondary-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        ${calculateTotalInvestment().toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Total invested capital</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="luxury-card hover-scale animate-scale-in group cursor-pointer" style={{ animationDelay: '0.3s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Return on Investment</CardTitle>
                      <div className={`p-2 rounded-full transition-colors ${
                        calculateROI() >= 0 
                          ? 'bg-green-500/10 group-hover:bg-green-500/20' 
                          : 'bg-red-500/10 group-hover:bg-red-500/20'
                      }`}>
                        {calculateROI() >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${
                        calculateROI() >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {calculateROI().toFixed(2)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {calculateROI() >= 0 ? 'Profit generated' : 'Current loss'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Tabs */}
                <Tabs defaultValue="holdings" className="w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <TabsList className="grid w-full grid-cols-3 luxury-card">
                    <TabsTrigger value="holdings" className="text-base font-medium">
                      My Holdings
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="text-base font-medium">
                      Active Sales ({activeSales.length})
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="text-base font-medium">
                      Transaction History
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="holdings" className="space-y-6 mt-8">
                    {ownerships.length === 0 ? (
                      <Card className="luxury-card animate-scale-in">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">No investments yet</h3>
                          <p className="text-muted-foreground mb-6">
                            Start building your portfolio by investing in premium whisky casks
                          </p>
                          <button className="luxury-button px-6 py-2 rounded-lg font-medium hover-scale">
                            Visit Marketplace
                          </button>
                        </CardContent>
                      </Card>
                    ) : (
                      ownerships.map((ownership, index) => (
                        <Card key={ownership.id} className="luxury-card hover-scale animate-fade-in group overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <CardHeader className="relative">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <CardTitle className="text-2xl luxury-text-gradient">
                                  {ownership.casks.spirit_name}
                                </CardTitle>
                                <CardDescription className="text-base">
                                  {ownership.casks.distilleries.name} • Cask #{ownership.casks.cask_number}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                                {ownership.ownership_percentage}% ownership
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6 relative">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Your Volume</p>
                                <p className="text-xl font-bold">{ownership.volume_liters}L</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Current Value</p>
                                <p className="text-xl font-bold luxury-text-gradient">
                                  ${(ownership.casks.price_per_liter * ownership.volume_liters).toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Alcohol %</p>
                                <p className="text-xl font-bold">{ownership.casks.alcohol_percentage}%</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Acquired</p>
                                <p className="text-xl font-bold">{format(new Date(ownership.acquired_date), 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Maturation Progress</span>
                                <span className="text-sm font-bold text-primary">
                                  {getMaturityProgress(
                                    ownership.casks.distillation_date,
                                    ownership.casks.expected_maturation_years
                                  ).toFixed(1)}%
                                </span>
                              </div>
                              <div className="relative">
                                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-1000 shadow-lg"
                                    style={{
                                      width: `${getMaturityProgress(
                                        ownership.casks.distillation_date,
                                        ownership.casks.expected_maturation_years
                                      )}%`
                                    }}
                                  />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent animate-pulse" />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                              <MapPin className="h-5 w-5 text-primary" />
                              <span className="font-medium">{ownership.casks.warehouse_location}</span>
                            </div>
                            
                            {ownership.casks.tasting_notes && (
                              <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-primary/5 border border-secondary/20">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Tasting Notes</p>
                                <p className="text-sm leading-relaxed">{ownership.casks.tasting_notes}</p>
                              </div>
                            )}

                            {/* Sell Button */}
                            <div className="flex justify-end pt-4">
                              {isOwnershipForSale(ownership.id) ? (
                                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                                  Listed for Sale
                                </Badge>
                              ) : (
                                <Button
                                  onClick={() => handleSellCask(ownership)}
                                  className="luxury-button"
                                  size="sm"
                                >
                                  <Store className="h-4 w-4 mr-2" />
                                  Sell This Cask
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="sales" className="space-y-6 mt-8">
                    {activeSales.length === 0 ? (
                      <Card className="luxury-card animate-scale-in">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Store className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">No active sales</h3>
                          <p className="text-muted-foreground mb-6">
                            You don't have any casks currently listed for sale
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      activeSales.map((sale, index) => (
                        <Card key={sale.id} className="luxury-card hover-scale animate-fade-in group overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <CardHeader className="relative">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <CardTitle className="text-2xl luxury-text-gradient">
                                  {sale.cask_ownership.casks.spirit_name}
                                </CardTitle>
                                <CardDescription className="text-base">
                                  {sale.cask_ownership.casks.distilleries.name} • Cask #{sale.cask_ownership.casks.cask_number}
                                </CardDescription>
                              </div>
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">
                                Active Listing
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6 relative">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Volume for Sale</p>
                                <p className="text-xl font-bold">{sale.volume_for_sale_liters}L</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Price per Liter</p>
                                <p className="text-xl font-bold luxury-text-gradient">
                                  ${sale.asking_price_per_liter.toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Total Price</p>
                                <p className="text-xl font-bold luxury-text-gradient">
                                  ${sale.total_asking_price.toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Listed</p>
                                <p className="text-xl font-bold">{format(new Date(sale.listing_date), 'MMM dd, yyyy')}</p>
                              </div>
                            </div>

                            {sale.expires_at && (
                              <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                                <Calendar className="h-5 w-5 text-primary" />
                                <span>Expires: {format(new Date(sale.expires_at), 'MMM dd, yyyy')}</span>
                              </div>
                            )}

                            {sale.notes && (
                              <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-primary/5 border border-secondary/20">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Listing Notes</p>
                                <p className="text-sm leading-relaxed">{sale.notes}</p>
                              </div>
                            )}

                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                onClick={() => handleCancelSale(sale.id)}
                                className="border-red-500/20 text-red-600 hover:bg-red-500/10"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Listing
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="transactions" className="space-y-6 mt-8">
                    {transactions.length === 0 ? (
                      <Card className="luxury-card animate-scale-in">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
                          <p className="text-muted-foreground">Your transaction history will appear here</p>
                        </CardContent>
                      </Card>
                    ) : (
                      transactions.map((transaction, index) => (
                        <Card key={transaction.id} className="luxury-card hover-scale animate-fade-in group" style={{ animationDelay: `${index * 0.1}s` }}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3 flex-1">
                                <div>
                                  <p className="text-lg font-semibold luxury-text-gradient">
                                    {transaction.casks.spirit_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {transaction.casks.distilleries.name} • Cask #{transaction.casks.cask_number}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span>{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="text-2xl font-bold luxury-text-gradient">
                                  ${transaction.total_amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium">
                                  {transaction.volume_liters}L
                                </p>
                                <Badge 
                                  variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                                  className={`px-3 py-1 ${
                                    transaction.status === 'completed' 
                                      ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {transaction.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div>
      
      <SellCaskDialog
        open={sellDialogOpen}
        onOpenChange={setSellDialogOpen}
        ownership={selectedOwnership}
        onSaleCreated={fetchPortfolioData}
      />
    </SidebarProvider>
  );
};

export default Portfolio;