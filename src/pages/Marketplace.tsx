import { useState, useEffect } from 'react';
import { calculatePricePerLPA, calculateLPA, formatLPA } from '@/utils/lpaCalculations';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useComparison } from '@/contexts/ComparisonContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
  Eye,
  ArrowLeftRight,
  HandCoins
} from 'lucide-react';
import { MarketplaceAnalytics } from '@/components/MarketplaceAnalytics';
import { MatchmakingSystem } from '@/components/MatchmakingSystem';
import { MakeOfferDialog } from '@/components/MakeOfferDialog';
import { CaskWorldMap } from '@/components/CaskWorldMap';

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
    profile_id?: string;
  };
  cask_types?: {
    name: string;
    capacity_liters: number;
  };
}

interface UnifiedListing {
  id: string;
  cask_id: string;
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
    profile_id?: string;
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
  last_gauging_date?: string | null;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToComparison, isInComparison } = useComparison();
  const { formatPrice } = useCurrency();
  const [selectedOfferListing, setSelectedOfferListing] = useState<UnifiedListing | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
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
            verified,
            profile_id
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

      // Transform primary casks to unified format - filter out incomplete listings
      const primaryUnified: UnifiedListing[] = (primaryCasks || [])
        .filter(cask => 
          cask.price_per_liter != null && 
          cask.total_price != null && 
          cask.current_volume_liters != null && 
          cask.alcohol_percentage != null
        )
        .map(cask => ({
          id: cask.id,
          cask_id: cask.id,
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
          is_resale: false,
          seller_id: cask.distilleries?.profile_id,
          last_gauging_date: cask.last_gauging_date
        }));

      // Transform secondary listings to unified format - filter out incomplete ones
      const secondaryUnified: UnifiedListing[] = (secondaryListings || [])
        .filter(listing => {
          // Only include if cask data exists and has essential fields
          const cask = listing.cask_ownership?.casks;
          return cask && cask.spirit_name && cask.cask_number;
        })
        .map(listing => {
          const cask = listing.cask_ownership!.casks!;
          const roi = listing.cask_ownership?.acquisition_price 
            ? ((listing.total_asking_price - listing.cask_ownership.acquisition_price) / listing.cask_ownership.acquisition_price) * 100
            : 0;

          return {
            id: listing.id,
            cask_id: listing.cask_ownership?.cask_id,
            spirit_name: cask.spirit_name,
            cask_number: cask.cask_number,
            distillation_date: cask.distillation_date || '',
            current_volume_liters: listing.volume_for_sale_liters,
            alcohol_percentage: cask.alcohol_percentage || null,
            price_per_liter: listing.asking_price_per_liter,
            total_price: listing.total_asking_price,
            warehouse_location: cask.warehouse_location,
            tasting_notes: cask.tasting_notes,
            created_at: listing.created_at,
            updated_at: listing.created_at,
            distilleries: cask.distilleries,
            cask_types: cask.cask_types,
            is_resale: true,
            seller_id: listing.seller_id,
            ownership_id: listing.ownership_id,
            acquisition_price: listing.cask_ownership?.acquisition_price,
            roi: roi,
            blockchain_hash: cask.blockchain_hash,
            seller_name: listing.profiles 
              ? `${listing.profiles.first_name} ${listing.profiles.last_name}` 
              : 'Anonymous',
            last_gauging_date: listing.last_gauging_date
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
      const lowerSearch = searchTerm.toLowerCase();
      const distilleryName = listing.distilleries?.name?.toLowerCase() || "";
      const tastingNotes = listing.tasting_notes?.toLowerCase() || "";

      const matchesSearch =
        listing.spirit_name.toLowerCase().includes(lowerSearch) ||
        distilleryName.includes(lowerSearch) ||
        tastingNotes.includes(lowerSearch);
      
      const matchesType = filterType === 'all' || 
        (filterType === 'resale' && listing.is_resale) ||
        (filterType === 'scotch' && listing.spirit_name.toLowerCase().includes('scotch')) ||
        (filterType === 'bourbon' && listing.spirit_name.toLowerCase().includes('bourbon')) ||
        (filterType === 'irish' && listing.spirit_name.toLowerCase().includes('irish'));
      
      const listingLPA = calculatePricePerLPA(listing.total_price, listing.current_volume_liters, listing.alcohol_percentage);
      const matchesPrice = maxPrice === '' || (listingLPA && listingLPA <= maxPrice);
      return matchesSearch && matchesType && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return calculatePricePerLPA(a.total_price, a.current_volume_liters, a.alcohol_percentage) - calculatePricePerLPA(b.total_price, b.current_volume_liters, b.alcohol_percentage);
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
    <div className="mobile-container space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="mobile-sticky-header py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="mobile-heading font-bold flex items-center gap-2">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Marketplace
            </h1>
            <p className="mobile-body text-muted-foreground mt-1">
              Primary and secondary cask trading
            </p>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="marketplace" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">All Casks</span>
            <span className="sm:hidden">Casks</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">World Map</span>
            <span className="sm:hidden">Map</span>
          </TabsTrigger>
          <TabsTrigger value="matchmaking" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Matchmaking</span>
            <span className="sm:hidden">Match</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        {selectedTab === 'marketplace' && (
          <Card className="mobile-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search spirits, distillery..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full mobile-touch-target"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-48 mobile-touch-target">
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
                    <SelectTrigger className="w-full sm:w-40 mobile-touch-target">
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
                </div>
                <Input
                  type="number"
                  placeholder="Max price per cask"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full mobile-touch-target"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="mobile-card hover:shadow-lg transition-all cursor-pointer touch-highlight-none active:scale-[0.98]">
                <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">{listing.spirit_name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm truncate">
                        Cask #{listing.cask_number}
                      </CardDescription>
                      <CardDescription className="text-xs truncate mt-1">
                        {listing.distilleries?.name}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {listing.distilleries?.verified && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 h-auto whitespace-nowrap">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {listing.is_resale && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 h-auto">
                          Resale
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mobile-touch-target h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToWishlist(listing.cask_id);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price per LPA</span>
                    <span className="font-bold text-lg">{formatPrice(calculatePricePerLPA(listing.total_price, listing.current_volume_liters, listing.alcohol_percentage))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total (per Barrel)</span>
                    <span className="font-semibold">{formatPrice(listing.total_price || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Volume</span>
                    <span>{listing.current_volume_liters ?? 0}L ({formatLPA(calculateLPA(listing.current_volume_liters, listing.alcohol_percentage))})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ABV</span>
                    <span>{listing.alcohol_percentage ?? 0}%</span>
                  </div>
                  {listing.last_gauging_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Gauging</span>
                      <span className="text-sm">{new Date(listing.last_gauging_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
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
                      onClick={() => navigate(`/cask/${listing.cask_id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {listing.seller_id && listing.seller_id !== user?.id && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            toast.error('Please log in to make an offer');
                            return;
                          }
                          setSelectedOfferListing(listing);
                          setOfferDialogOpen(true);
                        }}
                      >
                        <HandCoins className="h-3 w-3 mr-1" />
                        Offer
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant={isInComparison(listing.id) ? "secondary" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isInComparison(listing.id)) {
                          addToComparison({
                            id: listing.id,
                            spirit_name: listing.spirit_name,
                            cask_number: listing.cask_number,
                            distillery: listing.distilleries ? {
                              name: listing.distilleries.name,
                              location: listing.distilleries.location || undefined
                            } : undefined,
                            distillation_date: listing.distillation_date,
                            current_volume_liters: listing.current_volume_liters || undefined,
                            alcohol_percentage: listing.alcohol_percentage || undefined,
                            price_per_liter: listing.price_per_liter || undefined,
                            total_price: listing.total_price || undefined,
                            cask_type: listing.cask_types ? {
                              name: listing.cask_types.name,
                              capacity_liters: listing.cask_types.capacity_liters
                            } : undefined,
                            tasting_notes: listing.tasting_notes || undefined,
                            warehouse_location: listing.warehouse_location || undefined,
                            expected_maturation_years: listing.expected_maturation_years || undefined
                          });
                        }
                      }}
                    >
                      <ArrowLeftRight className="h-3 w-3" />
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

        <TabsContent value="map" className="space-y-6">
          <CaskWorldMap listings={allListings} formatPrice={formatPrice} />
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

      {/* Make Offer Dialog */}
      {selectedOfferListing && (
        <MakeOfferDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          listing={{
             id: selectedOfferListing.is_resale ? selectedOfferListing.ownership_id || selectedOfferListing.id : selectedOfferListing.id,
             cask_id: selectedOfferListing.cask_id,
             seller_id: selectedOfferListing.seller_id,
             spirit_name: selectedOfferListing.spirit_name,
             cask_number: selectedOfferListing.cask_number,
             current_volume_liters: selectedOfferListing.current_volume_liters || 0,
             alcohol_percentage: selectedOfferListing.alcohol_percentage || 0,
             price_per_liter: selectedOfferListing.price_per_liter || 0,
             total_price: selectedOfferListing.total_price || 0,
             saleListingId: selectedOfferListing.is_resale ? selectedOfferListing.id : null,
           }}
        />
      )}
    </div>
  );
};

export default Marketplace;