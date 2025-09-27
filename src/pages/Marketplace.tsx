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

interface UnifiedListing {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillation_date: string;
  expected_maturation_years?: number | null;
  current_volume_liters: number | null;
  alcohol_percentage: number | null;
  price_per_liter: number | null;
  total_price: number | null;
  warehouse_location?: string | null;
  tasting_notes?: string | null;
  available_for_sale?: boolean | null;
  created_at: string;
  updated_at: string;
  distillery_id?: string;
  cask_type_id?: string;
  distilleries?: {
    name: string;
    location: string | null;
    verified: boolean | null;
  };
  cask_types?: {
    name: string;
    capacity_liters: number;
  };
  // Secondary market specific fields
  is_resale?: boolean;
  seller_id?: string;
  ownership_id?: string;
  acquisition_price?: number;
  roi?: number;
  blockchain_hash?: string;
  seller_name?: string;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allListings, setAllListings] = useState<UnifiedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'name' | 'roi'>('date');
  const [filterType, setFilterType] = useState<'all' | 'scotch' | 'bourbon' | 'irish' | 'resale'>('all');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedTab, setSelectedTab] = useState('marketplace');

  useEffect(() => {
    fetchAllListings();
  }, []);

  const fetchAllListings = async () => {
    try {
      // Fetch primary market casks
      const { data: primaryCasks, error: primaryError } = await supabase
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

      if (primaryError) throw primaryError;

      // Fetch secondary market listings
      const { data: secondaryListings, error: secondaryError } = await supabase
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
              warehouse_location,
              tasting_notes,
              distilleries (
                name,
                location,
                verified
              ),
              cask_types (
                name,
                capacity_liters
              )
            )
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (secondaryError) throw secondaryError;

      // Transform primary casks to unified format
      const primaryUnified: UnifiedListing[] = (primaryCasks || []).map(cask => ({
        id: cask.id,
        spirit_name: cask.spirit_name,
        cask_number: cask.cask_number,
        distillation_date: cask.distillation_date,
        expected_maturation_years: cask.expected_maturation_years,
        current_volume_liters: cask.current_volume_liters,
        alcohol_percentage: cask.alcohol_percentage,
        price_per_liter: cask.price_per_liter,
        total_price: cask.total_price,
        warehouse_location: cask.warehouse_location,
        tasting_notes: cask.tasting_notes,
        available_for_sale: cask.available_for_sale,
        created_at: cask.created_at,
        updated_at: cask.updated_at,
        distillery_id: cask.distillery_id,
        cask_type_id: cask.cask_type_id,
        distilleries: cask.distilleries,
        cask_types: cask.cask_types,
        is_resale: false
      }));

      // Transform secondary listings to unified format
      const secondaryUnified: UnifiedListing[] = (secondaryListings || []).map(listing => {
        const cask = listing.cask_ownership?.casks;
        const roi = listing.cask_ownership?.acquisition_price 
          ? ((listing.total_asking_price - listing.cask_ownership.acquisition_price) / listing.cask_ownership.acquisition_price) * 100
          : 0;

        return {
          id: listing.id,
          spirit_name: cask?.spirit_name || '',
          cask_number: cask?.cask_number || '',
          distillation_date: cask?.distillation_date || '',
          current_volume_liters: listing.volume_for_sale_liters,
          alcohol_percentage: cask?.alcohol_percentage || null,
          price_per_liter: listing.asking_price_per_liter,
          total_price: listing.total_asking_price,
          warehouse_location: cask?.warehouse_location,
          tasting_notes: cask?.tasting_notes,
          created_at: listing.created_at,
          updated_at: listing.created_at,
          distilleries: cask?.distilleries,
          cask_types: cask?.cask_types,
          is_resale: true,
          seller_id: listing.seller_id,
          ownership_id: listing.ownership_id,
          acquisition_price: listing.cask_ownership?.acquisition_price,
          roi: roi,
          blockchain_hash: cask?.blockchain_hash,
          seller_name: listing.profiles && listing.profiles.length > 0 
            ? `${listing.profiles[0].first_name} ${listing.profiles[0].last_name}` 
            : 'Anonymous'
        };
      });

      // Combine all listings
      setAllListings([...primaryUnified, ...secondaryUnified]);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
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

  const filteredListings = allListings
    .filter(listing => {
      const matchesSearch = listing.spirit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.distilleries?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (listing.tasting_notes && listing.tasting_notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || 
        (filterType === 'resale' && listing.is_resale) ||
        (filterType === 'scotch' && listing.spirit_name.toLowerCase().includes('scotch')) ||
        (filterType === 'bourbon' && listing.spirit_name.toLowerCase().includes('bourbon')) ||
        (filterType === 'irish' && listing.spirit_name.toLowerCase().includes('irish'));
      
      const matchesPrice = maxPrice === '' || (listing.price_per_liter && listing.price_per_liter <= maxPrice);
      return matchesSearch && matchesType && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price_per_liter || 0) - (b.price_per_liter || 0);
        case 'name':
          return a.spirit_name.localeCompare(b.spirit_name);
        case 'roi':
          return (b.roi || 0) - (a.roi || 0);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            All Casks
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

        {/* Filters */}
        {selectedTab === 'marketplace' && (
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
                    <SelectItem value="roi">Highest ROI</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="resale">Resale Only</SelectItem>
                    <SelectItem value="scotch">Scotch</SelectItem>
                    <SelectItem value="bourbon">Bourbon</SelectItem>
                    <SelectItem value="irish">Irish</SelectItem>
                  </SelectContent>
                </Select>
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

        <TabsContent value="marketplace" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Cask Marketplace</h2>
              <p className="text-muted-foreground">
                Primary and secondary market casks in one place
              </p>
            </div>
            <Badge variant="secondary">
              {filteredListings.length} casks available
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{listing.spirit_name}</CardTitle>
                      <CardDescription>
                        Cask #{listing.cask_number} • {listing.distilleries?.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {listing.distilleries?.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {listing.is_resale && (
                        <Badge variant="outline" className="text-xs">
                          Resale
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToWishlist(listing.is_resale ? listing.ownership_id || listing.id : listing.id);
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
                    <span className="font-bold text-lg">£{listing.price_per_liter}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Price</span>
                    <span className="font-semibold">£{listing.total_price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Volume</span>
                    <span>{listing.current_volume_liters}L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ABV</span>
                    <span>{listing.alcohol_percentage}%</span>
                  </div>
                  
                  {listing.is_resale && listing.roi !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Potential ROI</span>
                      <span className={`font-semibold flex items-center gap-1 ${listing.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {listing.roi >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                        {listing.roi.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Distilled {new Date(listing.distillation_date).getFullYear()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.distilleries?.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      {listing.cask_types?.name} ({listing.cask_types?.capacity_liters}L)
                    </div>
                    {listing.is_resale && (
                      <div className="text-xs text-green-600 font-medium">
                        Sold by: {listing.seller_name}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/cask/${listing.is_resale ? listing.ownership_id : listing.id}`)}
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
                    Listed {new Date(listing.created_at).toLocaleDateString()}
                  </div>

                  {listing.blockchain_hash && (
                    <div className="text-xs text-muted-foreground font-mono p-2 bg-muted rounded truncate">
                      Blockchain: {listing.blockchain_hash}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredListings.length === 0 && (
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

        <TabsContent value="matchmaking" className="space-y-6">
          <MatchmakingSystem />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MarketplaceAnalytics data={{
            totalListings: allListings.length,
            averagePrice: allListings.length > 0 ? allListings.reduce((sum, listing) => sum + (listing.total_price || 0), 0) / allListings.length : 0,
            priceChange: 2.5,
            totalVolume: allListings.reduce((sum, listing) => sum + (listing.current_volume_liters || 0), 0),
            activeDistilleries: new Set(allListings.map(listing => listing.distilleries?.name).filter(Boolean)).size,
            recentSales: 15
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketplace;