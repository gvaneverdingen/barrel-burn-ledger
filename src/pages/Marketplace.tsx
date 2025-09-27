import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Package, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Droplets, 
  TrendingUp,
  Heart,
  ShoppingCart,
  RefreshCw,
  DollarSign,
  Clock,
  Shield,
  Eye
} from 'lucide-react';
import { MarketplaceAnalytics } from '@/components/MarketplaceAnalytics';
import { MatchmakingSystem } from '@/components/MatchmakingSystem';

interface Cask {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillation_date: string;
  expected_maturation_years: number | null;
  current_volume_liters: number | null;
  alcohol_percentage: number | null;
  price_per_liter: number | null;
  total_price: number | null;
  warehouse_location: string | null;
  tasting_notes: string | null;
  available_for_sale: boolean | null;
  created_at: string;
  updated_at: string;
  distillery_id: string;
  cask_type_id: string;
  distilleries?: {
    name: string;
    location: string | null;
    verified: boolean | null;
  };
  cask_types?: {
    name: string;
    capacity_liters: number;
  };
}

interface SecondaryListing {
  id: string;
  ownership_id: string;
  seller_id: string;
  asking_price_per_liter: number;
  total_asking_price: number;
  volume_for_sale_liters: number;
  status: string;
  created_at: string;
  cask_ownership?: {
    cask_id: string;
    acquisition_price: number;
    acquired_date: string;
    casks?: {
      spirit_name: string;
      cask_number: string;
      distillation_date: string;
      alcohol_percentage: number;
      blockchain_hash: string;
      distilleries: {
        name: string;
        location: string;
        verified: boolean;
      };
    };
  };
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [casks, setCasks] = useState<Cask[]>([]);
  const [secondaryListings, setSecondaryListings] = useState<SecondaryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'name' | 'roi'>('date');
  const [filterType, setFilterType] = useState<'all' | 'scotch' | 'bourbon' | 'irish'>('all');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedTab, setSelectedTab] = useState('primary');

  useEffect(() => {
    fetchCasks();
    fetchSecondaryListings();
  }, []);

  const fetchCasks = async () => {
    try {
      const { data, error } = await supabase
        .from('casks')
        .select(`
          *,
          distilleries (
            name,
            location,
            verified
          ),
          cask_types (
            name,
            capacity_liters
          )
        `)
        .eq('available_for_sale', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCasks(data || []);
    } catch (error) {
      console.error('Error fetching casks:', error);
      toast.error('Failed to load casks');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecondaryListings = async () => {
    try {
      const { data, error } = await supabase
        .from('cask_sales')
        .select(`
          *,
          cask_ownership (
            cask_id,
            acquisition_price,
            acquired_date,
            casks (
              spirit_name,
              cask_number,
              distillation_date,
              alcohol_percentage,
              blockchain_hash,
              distilleries (
                name,
                location,
                verified
              )
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSecondaryListings(data || []);
    } catch (error) {
      console.error('Error fetching secondary listings:', error);
      toast.error('Failed to load secondary market listings');
    }
  };

  const calculateROI = (listing: SecondaryListing) => {
    if (!listing.cask_ownership?.acquisition_price) return 0;
    const originalPrice = listing.cask_ownership.acquisition_price;
    const currentPrice = listing.total_asking_price;
    return ((currentPrice - originalPrice) / originalPrice) * 100;
  };

  const addToWishlist = async (caskId: string) => {
    if (!user) {
      toast.error('Please log in to add to wishlist');
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          cask_id: caskId,
          max_price: 0, // User can update this later
          notes: ''
        });

      if (error) throw error;
      toast.success('Added to wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const filteredCasks = casks
    .filter(cask => {
      const matchesSearch = cask.spirit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cask.distilleries?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cask.tasting_notes && cask.tasting_notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || 
        (filterType === 'scotch' && cask.spirit_name.toLowerCase().includes('scotch')) ||
        (filterType === 'bourbon' && cask.spirit_name.toLowerCase().includes('bourbon')) ||
        (filterType === 'irish' && cask.spirit_name.toLowerCase().includes('irish'));
      const matchesPrice = maxPrice === '' || (cask.price_per_liter && cask.price_per_liter <= maxPrice);
      return matchesSearch && matchesType && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price_per_liter || 0) - (b.price_per_liter || 0);
        case 'name':
          return a.spirit_name.localeCompare(b.spirit_name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const filteredSecondaryListings = secondaryListings
    .filter(listing => {
      const matchesSearch = listing.cask_ownership?.casks?.spirit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.cask_ownership?.casks?.distilleries?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = maxPrice === '' || listing.asking_price_per_liter <= Number(maxPrice);
      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.asking_price_per_liter - b.asking_price_per_liter;
        case 'roi':
          return calculateROI(b) - calculateROI(a);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-500" />
            Unified Marketplace
          </h1>
          <p className="text-muted-foreground">
            Primary and secondary cask trading with advanced analytics
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="primary" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Primary Market
          </TabsTrigger>
          <TabsTrigger value="secondary" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Secondary Market
          </TabsTrigger>
          <TabsTrigger value="matchmaking" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Matchmaking
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Filters - Common for Primary and Secondary */}
        {(selectedTab === 'primary' || selectedTab === 'secondary') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by spirit name, distillery, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Newest First</SelectItem>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    {selectedTab === 'secondary' && (
                      <SelectItem value="roi">Highest ROI</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedTab === 'primary' && (
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Spirit Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="scotch">Scotch</SelectItem>
                      <SelectItem value="bourbon">Bourbon</SelectItem>
                      <SelectItem value="irish">Irish</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input
                  type="number"
                  placeholder="Max price per liter"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full md:w-48"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="primary" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Primary Market</h2>
              <p className="text-muted-foreground">
                New casks directly from verified distilleries
              </p>
            </div>
            <Badge variant="secondary">
              {filteredCasks.length} casks available
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCasks.map((cask) => (
              <Card key={cask.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cask.spirit_name}</CardTitle>
                      <CardDescription>
                        Cask #{cask.cask_number} • {cask.distilleries?.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {cask.distilleries?.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToWishlist(cask.id);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price per Liter</span>
                    <span className="font-bold text-lg">£{cask.price_per_liter}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Price</span>
                    <span className="font-semibold">£{cask.total_price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Volume</span>
                    <span>{cask.current_volume_liters}L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ABV</span>
                    <span>{cask.alcohol_percentage}%</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Distilled {new Date(cask.distillation_date).getFullYear()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {cask.distilleries?.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      {cask.cask_types?.name} ({cask.cask_types?.capacity_liters}L)
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/cask/${cask.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Buy Now
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Listed {new Date(cask.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCasks.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No casks found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="secondary" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Secondary Market</h2>
              <p className="text-muted-foreground">
                Resale casks with full blockchain transparency
              </p>
            </div>
            <Badge variant="secondary">
              {filteredSecondaryListings.length} listings available
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSecondaryListings.map((listing) => {
              const roi = calculateROI(listing);
              return (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {listing.cask_ownership?.casks?.spirit_name}
                        </CardTitle>
                        <CardDescription>
                          Cask #{listing.cask_ownership?.casks?.cask_number}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        {listing.cask_ownership?.casks?.distilleries?.verified && (
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline">Resale</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Price per Liter</span>
                        <span className="font-bold text-lg">£{listing.asking_price_per_liter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Price</span>
                        <span className="font-semibold">£{listing.total_asking_price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Volume</span>
                        <span>{listing.volume_for_sale_liters}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Potential ROI</span>
                        <span className={`font-semibold flex items-center gap-1 ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {roi >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                          {roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Distillery: {listing.cask_ownership?.casks?.distilleries?.name}</div>
                      <div>Listed: {new Date(listing.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Buy Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>

                    {listing.cask_ownership?.casks?.blockchain_hash && (
                      <div className="text-xs text-muted-foreground font-mono p-2 bg-muted rounded truncate">
                        Blockchain: {listing.cask_ownership.casks.blockchain_hash}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredSecondaryListings.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No secondary listings found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matchmaking" className="space-y-6">
          <MatchmakingSystem />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MarketplaceAnalytics data={{
            totalListings: casks.length + secondaryListings.length,
            averagePrice: casks.length > 0 ? casks.reduce((sum, cask) => sum + (cask.total_price || 0), 0) / casks.length : 0,
            priceChange: 2.5,
            totalVolume: casks.reduce((sum, cask) => sum + (cask.current_volume_liters || 0), 0),
            activeDistilleries: new Set(casks.map(cask => cask.distilleries?.name).filter(Boolean)).size,
            recentSales: 15
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketplace;