import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, MapPin, Calendar, BarChart3, LogOut, Home, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import arigiLogo from '@/assets/arigi-logo.png';
import marketplaceBg from '@/assets/marketplace-bg.jpg';

interface Cask {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillation_date: string;
  expected_maturation_years: number;
  current_volume_liters: number;
  alcohol_percentage: number;
  price_per_liter: number;
  total_price: number;
  warehouse_location: string;
  tasting_notes: string;
  blockchain_id: string;
  original_cask_type: string;
  finishing_cask_type: string;
  finishing_duration_months: number;
  finishing_notes: string;
  has_been_finished: boolean;
  distillery: {
    name: string;
    location: string;
  };
  cask_type: {
    name: string;
    capacity_liters: number;
  };
  // Add fields for sales listings
  is_sale_listing?: boolean;
  sale_id?: string;
  volume_for_sale?: number;
  seller?: {
    first_name?: string;
    last_name?: string;
  };
}

const Marketplace = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [casks, setCasks] = useState<Cask[]>([]);
  const [filteredCasks, setFilteredCasks] = useState<Cask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [filterByDistillery, setFilterByDistillery] = useState('all');

  // Allow access without authentication

  useEffect(() => {
    fetchCasks();
  }, []);

  useEffect(() => {
    filterAndSortCasks();
  }, [casks, searchTerm, sortBy, filterByDistillery]);

  const fetchCasks = async () => {
    try {
      // Fetch regular casks available for sale (new from distilleries)
      const { data: directCasks, error: casksError } = await supabase
        .from('casks')
        .select(`
          *,
          distillery:distilleries (
            name,
            location
          ),
          cask_type:cask_types (
            name,
            capacity_liters
          )
        `)
        .eq('available_for_sale', true);

      if (casksError) throw casksError;

      // Filter out casks that already have ownership records (have been sold)
      let availableCasks: Cask[] = [];
      if (directCasks) {
        const { data: ownedCasks, error: ownershipError } = await supabase
          .from('cask_ownership')
          .select('cask_id')
          .eq('is_active', true);

        if (ownershipError) {
          console.error('Error fetching ownership data:', ownershipError);
        }

        const ownedCaskIds = new Set(ownedCasks?.map(o => o.cask_id) || []);
        availableCasks = directCasks.filter(cask => !ownedCaskIds.has(cask.id));
      }

      // Fetch active cask sales (user-to-user sales)
      console.log("🔍 Fetching cask sales...");
      const { data: salesData, error: salesError } = await supabase
        .from('cask_sales')
        .select(`
          id,
          asking_price_per_liter,
          total_asking_price,
          volume_for_sale_liters,
          notes,
          ownership:cask_ownership!inner (
            volume_liters,
            casks!inner (
              *,
              distillery:distilleries (
                name,
                location
              ),
              cask_type:cask_types (
                name,
                capacity_liters
              )
            )
          ),
          seller:profiles!cask_sales_seller_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('status', 'active');

      console.log("📊 Sales data result:", { salesData, salesError });

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      }

      // Transform sales data to match Cask interface
      const salesCasks: Cask[] = salesData?.map(sale => {
        const cask = sale.ownership.casks;
        return {
          ...cask,
          // Override price and volume with sale data
          price_per_liter: sale.asking_price_per_liter,
          total_price: sale.total_asking_price,
          current_volume_liters: sale.volume_for_sale_liters,
          // Add sale-specific fields
          is_sale_listing: true,
          sale_id: sale.id,
          volume_for_sale: sale.volume_for_sale_liters,
          seller: Array.isArray(sale.seller) ? sale.seller[0] : sale.seller,
          // Keep original distillery and cask_type structure
          distillery: cask.distillery,
          cask_type: cask.cask_type,
        };
      }) || [];

      // Combine both types of listings
      const allCasks = [...availableCasks, ...salesCasks];
      setCasks(allCasks);

    } catch (error) {
      console.error('Error fetching casks:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortCasks = () => {
    let filtered = [...casks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        cask =>
          cask.spirit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cask.distillery?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cask.cask_type?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Distillery filter
    if (filterByDistillery !== 'all') {
      filtered = filtered.filter(cask => cask.distillery?.name === filterByDistillery);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.total_price - b.total_price;
        case 'age':
          return new Date(a.distillation_date).getTime() - new Date(b.distillation_date).getTime();
        case 'volume':
          return (b.current_volume_liters || 0) - (a.current_volume_liters || 0);
        default:
          return 0;
      }
    });

    setFilteredCasks(filtered);
  };

  const getDistilleries = () => {
    const distilleries = [...new Set(casks.map(cask => cask.distillery?.name).filter(Boolean))];
    return distilleries;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateAge = (distillationDate: string) => {
    const years = new Date().getFullYear() - new Date(distillationDate).getFullYear();
    return years;
  };

  // Calculate price per liter at 100% alcohol strength (ASL)
  const calculatePricePerLiterASL = (pricePerLiter: number, alcoholPercentage: number) => {
    if (!alcoholPercentage || alcoholPercentage === 0) return pricePerLiter;
    return pricePerLiter / (alcoholPercentage / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={arigiLogo} alt="ARIGI Logo" className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold text-foreground">ARIGI</h1>
            <span className="text-muted-foreground">|</span>
            <h2 className="text-lg font-medium text-foreground">Marketplace</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/portfolio')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button onClick={signOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="default" size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section with Background */}
        <div className="relative rounded-xl overflow-hidden mb-8">
          <div className="absolute inset-0">
            <img 
              src={marketplaceBg} 
              alt="Distillery warehouse" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          <div className="relative text-center py-16 px-8 text-white">
            <h3 className="text-4xl font-bold mb-4">
              Premium Whisky Cask Marketplace
            </h3>
            <p className="text-lg max-w-2xl mx-auto">
              Discover and invest in authenticated whisky casks from verified distilleries
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Search & Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search casks, distilleries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price (Low to High)</SelectItem>
                  <SelectItem value="age">Age (Oldest First)</SelectItem>
                  <SelectItem value="volume">Volume (High to Low)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterByDistillery} onValueChange={setFilterByDistillery}>
                <SelectTrigger>
                  <SelectValue placeholder="All Distilleries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Distilleries</SelectItem>
                  {getDistilleries().map((distillery) => (
                    <SelectItem key={distillery} value={distillery}>
                      {distillery}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredCasks.length} casks found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cask Grid */}
        {filteredCasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No casks found</h4>
              <p className="text-muted-foreground">
                {casks.length === 0 
                  ? "No casks are currently available in the marketplace." 
                  : "Try adjusting your search or filter criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCasks.map((cask) => (
              <Card key={cask.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/cask/${cask.id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{cask.spirit_name}</CardTitle>
                      <CardDescription className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{cask.distillery?.name}</span>
                        {cask.is_sale_listing && cask.seller && (
                          <span className="text-muted-foreground">
                            • Listed by {cask.seller.first_name} {cask.seller.last_name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="secondary">#{cask.cask_number}</Badge>
                      {cask.is_sale_listing && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Resale
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <p className="font-medium">{calculateAge(cask.distillation_date)} years</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume:</span>
                      <p className="font-medium">{cask.current_volume_liters}L</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ABV:</span>
                      <p className="font-medium">{cask.alcohol_percentage}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cask Type:</span>
                      <p className="font-medium">{cask.original_cask_type || cask.cask_type?.name}</p>
                    </div>
                  </div>

                  {/* Cask Finishing Information */}
                  {cask.has_been_finished && (
                    <div className="p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Finished
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Finishing:</span> {cask.finishing_cask_type}</p>
                        <p><span className="text-muted-foreground">Duration:</span> {cask.finishing_duration_months} months</p>
                      </div>
                    </div>
                  )}

                  {cask.tasting_notes && (
                    <div>
                      <span className="text-muted-foreground text-sm">Tasting Notes:</span>
                      <p className="text-sm mt-1">{cask.tasting_notes}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-muted-foreground">Total Price:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(cask.total_price)}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per liter:</span>
                        <span>{formatCurrency(cask.price_per_liter)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per liter (100% ASL):</span>
                        <span className="font-medium text-primary">
                          {formatCurrency(calculatePricePerLiterASL(cask.price_per_liter, cask.alcohol_percentage))}
                        </span>
                      </div>
                    </div>
                    
                    {user && (userRole === 'consumer' || userRole === 'investor') && (
                      <Button className="w-full">
                        View Details & Purchase
                      </Button>
                    )}
                    
                    {user && userRole === 'distillery' && (
                      <Button variant="outline" className="w-full" disabled>
                        Contact Seller
                      </Button>
                    )}
                    
                    {!user && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/auth');
                        }}
                      >
                        Sign In to Purchase
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Blockchain ID: {cask.blockchain_id}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace;