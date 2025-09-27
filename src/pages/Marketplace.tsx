import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, MapPin, Calendar, BarChart3, LogOut, Home, Package, TrendingUp, Users, Handshake, Eye, Heart, MessageCircle, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import arigiLogo from '@/assets/arigi-logo.png';
import marketplaceBg from '@/assets/marketplace-bg.jpg';
import { MarketplaceAnalytics } from '@/components/MarketplaceAnalytics';
import { MatchmakingSystem } from '@/components/MatchmakingSystem';

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
  available_for_sale: boolean;
  created_at: string;
  updated_at: string;
  distillery_id: string;
  cask_type_id: string;
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
  const [filterBySupplyType, setFilterBySupplyType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [ageRange, setAgeRange] = useState({ min: '', max: '' });
  const [activeTab, setActiveTab] = useState('browse');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [marketAnalytics, setMarketAnalytics] = useState<any>(null);

  // Allow access without authentication

  useEffect(() => {
    fetchCasks();
    fetchMarketAnalytics();
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortCasks();
  }, [casks, searchTerm, sortBy, filterByDistillery, filterBySupplyType, priceRange, ageRange]);

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

      // Fetch active cask sales (simplified approach)
      const { data: salesData, error: salesError } = await supabase
        .from('cask_sales')
        .select('*')
        .eq('status', 'active');

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      }

      // For each sale, manually build the cask data
      const salesCasks: Cask[] = [];
      if (salesData && salesData.length > 0) {
        for (const sale of salesData) {
          // Get ownership record
          const { data: ownership } = await supabase
            .from('cask_ownership')
            .select('cask_id')
            .eq('id', sale.ownership_id)
            .single();
            
          if (!ownership?.cask_id) continue;
          
          // Get cask data
          const { data: cask } = await supabase
            .from('casks')
            .select(`
              *,
              distillery:distilleries(name, location),
              cask_type:cask_types(name, capacity_liters)
            `)
            .eq('id', ownership.cask_id)
            .single();
            
          if (!cask) continue;
          
          // Get seller info
          const { data: seller } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', sale.seller_id)
            .single();
          
          const transformedCask = {
            // Start with base properties (non-price related)
            id: cask.id,
            spirit_name: cask.spirit_name,
            cask_number: cask.cask_number,
            distillation_date: cask.distillation_date,
            expected_maturation_years: cask.expected_maturation_years,
            alcohol_percentage: cask.alcohol_percentage,
            warehouse_location: cask.warehouse_location,
            tasting_notes: cask.tasting_notes,
            blockchain_id: cask.blockchain_id,
            original_cask_type: cask.original_cask_type,
            finishing_cask_type: cask.finishing_cask_type,
            finishing_duration_months: cask.finishing_duration_months,
            finishing_notes: cask.finishing_notes,
            has_been_finished: cask.has_been_finished,
            available_for_sale: cask.available_for_sale,
            created_at: cask.created_at,
            updated_at: cask.updated_at,
            distillery_id: cask.distillery_id,
            cask_type_id: cask.cask_type_id,
            
            // FORCE OVERRIDE PRICE VALUES 
            price_per_liter: Number(sale.asking_price_per_liter),
            total_price: Number(sale.total_asking_price), 
            current_volume_liters: Number(sale.volume_for_sale_liters),
            
            // Add sale-specific metadata
            is_sale_listing: true,
            sale_id: sale.id,
            volume_for_sale: Number(sale.volume_for_sale_liters),
            seller: seller || { first_name: 'Unknown', last_name: 'Seller' },
            distillery: cask.distillery,
            cask_type: cask.cask_type,
          };
          
          salesCasks.push(transformedCask);
        }
      }

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

  const fetchMarketAnalytics = async () => {
    try {
      // Calculate market analytics from casks data
      const totalListings = casks.length;
      const averagePrice = casks.length > 0 ? casks.reduce((sum, cask) => sum + cask.total_price, 0) / casks.length : 0;
      const totalVolume = casks.reduce((sum, cask) => sum + cask.current_volume_liters, 0);
      const activeDistilleries = new Set(casks.map(cask => cask.distillery?.name)).size;
      
      // Mock recent sales data
      const recentSales = Math.floor(Math.random() * 20) + 5;
      const priceChange = (Math.random() - 0.5) * 10; // Random change between -5% to +5%
      
      setMarketAnalytics({
        totalListings,
        averagePrice,
        priceChange,
        totalVolume,
        activeDistilleries,
        recentSales,
      });
    } catch (error) {
      console.error('Error fetching market analytics:', error);
    }
  };

  const fetchWatchlist = async () => {
    try {
      // Mock watchlist data - in real app, fetch from user preferences
      setWatchlist(['cask-1', 'cask-2']);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  const toggleWatchlist = async (caskId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to watchlist.",
        variant: "destructive",
      });
      return;
    }

    const isWatched = watchlist.includes(caskId);
    if (isWatched) {
      setWatchlist(prev => prev.filter(id => id !== caskId));
      toast({
        title: "Removed from Watchlist",
        description: "Item removed from your watchlist.",
      });
    } else {
      setWatchlist(prev => [...prev, caskId]);
      toast({
        title: "Added to Watchlist", 
        description: "Item added to your watchlist.",
      });
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
          cask.cask_type?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cask.warehouse_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cask.tasting_notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Supply type filter
    if (filterBySupplyType !== 'all') {
      if (filterBySupplyType === 'producers') {
        filtered = filtered.filter(cask => !cask.is_sale_listing);
      } else if (filterBySupplyType === 'resellers') {
        filtered = filtered.filter(cask => cask.is_sale_listing);
      }
    }

    // Distillery filter
    if (filterByDistillery !== 'all') {
      filtered = filtered.filter(cask => cask.distillery?.name === filterByDistillery);
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(cask => {
        const price = cask.total_price;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Age range filter
    if (ageRange.min || ageRange.max) {
      filtered = filtered.filter(cask => {
        const age = calculateAge(cask.distillation_date);
        const min = ageRange.min ? parseFloat(ageRange.min) : 0;
        const max = ageRange.max ? parseFloat(ageRange.max) : Infinity;
        return age >= min && age <= max;
      });
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
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating':
          // Mock rating sort - in real app would use actual ratings
          return Math.random() - 0.5;
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
              Connect with producers and resellers • Advanced matchmaking • Real-time analytics
            </p>
          </div>
        </div>

        {/* Market Analytics */}
        {marketAnalytics && (
          <MarketplaceAnalytics data={marketAnalytics} />
        )}

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Browse & Buy</span>
            </TabsTrigger>
            <TabsTrigger value="matchmaking" className="flex items-center space-x-2">
              <Handshake className="h-4 w-4" />
              <span>Matchmaking</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Market Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {/* Enhanced Filters and Search */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Advanced Search & Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search casks, distilleries, notes..."
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
                        <SelectItem value="newest">Newest Listed</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterBySupplyType} onValueChange={setFilterBySupplyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Supply Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="producers">Direct from Producers</SelectItem>
                        <SelectItem value="resellers">From Resellers</SelectItem>
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
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Price Range ($)</label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Min"
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({...prev, min: e.target.value}))}
                        />
                        <Input
                          placeholder="Max"
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({...prev, max: e.target.value}))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Age Range (years)</label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Min"
                          type="number"
                          value={ageRange.min}
                          onChange={(e) => setAgeRange(prev => ({...prev, min: e.target.value}))}
                        />
                        <Input
                          placeholder="Max"
                          type="number"
                          value={ageRange.max}
                          onChange={(e) => setAgeRange(prev => ({...prev, max: e.target.value}))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      {filteredCasks.length} casks found
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSearchTerm('');
                        setSortBy('price');
                        setFilterByDistillery('all');
                        setFilterBySupplyType('all');
                        setPriceRange({ min: '', max: '' });
                        setAgeRange({ min: '', max: '' });
                      }}
                    >
                      Clear Filters
                    </Button>
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
                  <Card key={cask.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate(`/cask/${cask.id}`)}>
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
                          <div className="flex items-center space-x-1">
                            <Badge variant="secondary">#{cask.cask_number}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist(cask.id);
                              }}
                            >
                              <Heart className={`h-4 w-4 ${watchlist.includes(cask.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cask.is_sale_listing ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Users className="h-3 w-3 mr-1" />
                                Reseller
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Producer
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Star className="h-3 w-3 mr-1" />
                              4.8
                            </Badge>
                          </div>
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
                     
                     <div className="flex space-x-2">
                       {user && (userRole === 'consumer' || userRole === 'investor') && (
                         <>
                           <Button className="flex-1">
                             <Eye className="h-4 w-4 mr-2" />
                             View Details
                           </Button>
                           <Button variant="outline" size="sm">
                             <MessageCircle className="h-4 w-4" />
                           </Button>
                         </>
                       )}
                       
                       {user && userRole === 'distillery' && (
                         <Button variant="outline" className="w-full">
                           <MessageCircle className="h-4 w-4 mr-2" />
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
                   </div>

                   <div className="text-xs text-muted-foreground pt-2 border-t">
                     Blockchain ID: {cask.blockchain_id}
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
       </TabsContent>

       <TabsContent value="matchmaking">
         <MatchmakingSystem />
       </TabsContent>

       <TabsContent value="analytics">
         <Card>
           <CardHeader>
             <CardTitle>Market Analytics & Reporting</CardTitle>
             <CardDescription>Comprehensive market insights and trends</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <h4 className="text-lg font-semibold mb-4">Price Trends</h4>
                 <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                   <p className="text-muted-foreground">Price trend chart placeholder</p>
                 </div>
               </div>
               <div>
                 <h4 className="text-lg font-semibold mb-4">Volume Analysis</h4>
                 <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                   <p className="text-muted-foreground">Volume analysis chart placeholder</p>
                 </div>
               </div>
               <div>
                 <h4 className="text-lg font-semibold mb-4">Regional Distribution</h4>
                 <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                   <p className="text-muted-foreground">Regional map placeholder</p>
                 </div>
               </div>
               <div>
                 <h4 className="text-lg font-semibold mb-4">Top Performers</h4>
                 <div className="space-y-3">
                   {['Highland Distillery', 'Speyside Premium', 'Islay Reserve'].map((name, idx) => (
                     <div key={name} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                       <span className="font-medium">{name}</span>
                       <Badge variant="outline" className="bg-green-50 text-green-700">
                         +{(idx + 1) * 5}%
                       </Badge>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       </TabsContent>
     </Tabs>
     </main>
     </div>
  );
};

export default Marketplace;