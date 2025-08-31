import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Package, DollarSign, Calendar, MapPin } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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

const Portfolio = () => {
  const { user } = useAuth();
  const [ownerships, setOwnerships] = useState<CaskOwnership[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add immediate debug logging
  console.log("=== PORTFOLIO COMPONENT RENDER ===");
  console.log("User object:", user);
  console.log("User ID:", user?.id);
  console.log("User email:", user?.email);
  console.log("Is user truthy:", !!user);
  
  // Force render this info on screen for debugging
  const debugInfo = `User ID: ${user?.id || 'null'}, Email: ${user?.email || 'null'}`;

  useEffect(() => {
    console.log("=== PORTFOLIO USEEFFECT TRIGGERED ===");
    console.log("User in useEffect:", user);
    console.log("User?.id:", user?.id);
    console.log("typeof user:", typeof user);
    console.log("!!user:", !!user);
    
    if (user?.id) { // Check for user.id specifically, not just user
      console.log("User ID exists, calling fetchPortfolioData");
      fetchPortfolioData();
    } else {
      console.log("No user ID, skipping fetchPortfolioData, setting loading to false");
      setLoading(false);
      setOwnerships([]);
      setTransactions([]);
    }
  }, [user?.id]); // Depend on user.id specifically

  const fetchPortfolioData = async () => {
    console.log("=== FETCH PORTFOLIO DATA CALLED ===");
    console.log("Function started with user:", user?.id);
    
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        console.log("No user ID available for query");
        setError("Please log in to view your portfolio");
        setLoading(false);
        return;
      }
      
      // First, let's try a simple query to see what ownership records exist
      const { data: allOwnerships, error: allError } = await supabase
        .from("cask_ownership")
        .select("*")
        .eq("is_active", true);
      
      console.log("All active ownerships:", allOwnerships);
      console.log("All ownerships error:", allError);
      
      // Now try with the specific user ID
      const { data: userOwnerships, error: userError } = await supabase
        .from("cask_ownership")
        .select("*")
        .eq("owner_id", user?.id)
        .eq("is_active", true);
      
      console.log("User ownerships (simple query):", userOwnerships);
      console.log("User ownerships error:", userError);

      // Simple direct query without complex joins first
      console.log("Trying simple query...");
      const { data: simpleData, error: simpleError } = await supabase
        .from("cask_ownership")
        .select("*")
        .eq("owner_id", user?.id)
        .eq("is_active", true);
      
      console.log("Simple query result:", simpleData, simpleError);
      
      if (simpleError) {
        console.error("Simple query error:", simpleError);
        setError(`Simple query failed: ${simpleError.message}`);
        return;
      }
      
      if (!simpleData || simpleData.length === 0) {
        console.log("No ownership records found for user:", user?.id);
        setError(`No ownership records found for user: ${user?.id}`);
        setOwnerships([]);
        setTransactions([]);
        setLoading(false);
        return;
      }

      // Simplified query first to test
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

      console.log("Ownership query result:", { ownershipData, ownershipError, userId: user?.id });
      console.log("=== PORTFOLIO DEBUG END ===");

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

      setOwnerships(ownershipData || []);
      setTransactions(transactionData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <main className="flex-1">
          <header className="h-16 border-b flex items-center px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold ml-4">Portfolio</h1>
          </header>
          
            <div className="p-6 space-y-6">
              {/* Debug Info */}
              <div className="bg-red-100 border border-red-300 p-4 rounded space-y-2">
                <p className="text-red-800">DEBUG: {debugInfo}</p>
                <p className="text-red-800">Expected Owner ID: fc1421f8-9702-4a0b-9a87-3d401cf1adfd</p>
                <p className="text-red-800">Ownerships found: {ownerships.length}</p>
                <p className="text-red-800">Loading: {loading ? 'true' : 'false'}</p>
                <p className="text-red-800">Error: {error || 'none'}</p>
                <div className="space-x-2">
                  <button 
                    onClick={fetchPortfolioData}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Force Refresh Data
                  </button>
                  <button 
                    onClick={() => {
                      // Force create mock data to test display
                      const mockOwnership: CaskOwnership = {
                        id: '21985be0-6c06-4cc9-a2d2-61ef6bad7d76',
                        ownership_percentage: 100,
                        volume_liters: 190,
                        acquired_date: '2025-08-31T19:01:36.46754+00:00',
                        acquisition_price: 76000,
                        casks: {
                          id: '61d4257f-6d08-458e-b4d6-f2571454be80',
                          spirit_name: 'Test Whisky 2',
                          cask_number: 'TEST-2-1753780924696',
                          distillation_date: '2006-01-01',
                          current_volume_liters: 190,
                          alcohol_percentage: 61,
                          price_per_liter: 400,
                          total_price: 76000,
                          warehouse_location: 'Test Warehouse 2',
                          tasting_notes: 'Rich and complex with notes from Sherry Butt',
                          expected_maturation_years: 14,
                          distilleries: {
                            name: 'Highland Test Distillery',
                            location: 'Speyside, Scotland'
                          },
                          cask_types: {
                            name: 'Sherry Butt',
                            capacity_liters: 500
                          }
                        }
                      };
                      setOwnerships([mockOwnership]);
                      setError('MOCK DATA - This is your actual cask from the database');
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Show My Cask (Mock)
                  </button>
                </div>
              </div>
            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${calculatePortfolioValue().toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${calculateTotalInvestment().toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">ROI</CardTitle>
                      {calculateROI() >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${calculateROI() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculateROI().toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs for different views */}
                <Tabs defaultValue="holdings" className="w-full">
                  <TabsList>
                    <TabsTrigger value="holdings">My Holdings</TabsTrigger>
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="holdings" className="space-y-4">
                    {ownerships.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">No cask investments yet. Visit the marketplace to start investing!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      ownerships.map((ownership) => (
                        <Card key={ownership.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{ownership.casks.spirit_name}</CardTitle>
                                <CardDescription>
                                  {ownership.casks.distilleries.name} • Cask #{ownership.casks.cask_number}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary">
                                {ownership.ownership_percentage}% ownership
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Your Volume</p>
                                <p className="font-medium">{ownership.volume_liters}L</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Current Value</p>
                                <p className="font-medium">
                                  ${(ownership.casks.price_per_liter * ownership.volume_liters).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Alcohol %</p>
                                <p className="font-medium">{ownership.casks.alcohol_percentage}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Acquired</p>
                                <p className="font-medium">{format(new Date(ownership.acquired_date), 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Maturation Progress</span>
                                <span>
                                  {getMaturityProgress(
                                    ownership.casks.distillation_date,
                                    ownership.casks.expected_maturation_years
                                  ).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${getMaturityProgress(
                                      ownership.casks.distillation_date,
                                      ownership.casks.expected_maturation_years
                                    )}%`
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{ownership.casks.warehouse_location}</span>
                            </div>
                            
                            {ownership.casks.tasting_notes && (
                              <div className="text-sm">
                                <p className="text-muted-foreground mb-1">Tasting Notes</p>
                                <p>{ownership.casks.tasting_notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="transactions" className="space-y-4">
                    {transactions.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">No transactions yet.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      transactions.map((transaction) => (
                        <Card key={transaction.id}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-medium">{transaction.casks.spirit_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.casks.distilleries.name} • Cask #{transaction.casks.cask_number}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${transaction.total_amount.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">{transaction.volume_liters}L</p>
                                <Badge 
                                  variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                                  className="mt-1"
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
    </SidebarProvider>
  );
};

export default Portfolio;