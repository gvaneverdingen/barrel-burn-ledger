import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  ShoppingCart,
  DollarSign,
  Clock,
  Shield,
  BarChart3
} from 'lucide-react';

interface SecondaryListing {
  id: string;
  ownership_id: string;
  seller_id: string;
  asking_price_per_liter: number;
  total_asking_price: number;
  volume_for_sale_liters: number;
  status: string;
  created_at: string;
  // Joined data
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

const SecondaryMarket = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<SecondaryListing[]>([]);
  const [myListings, setMyListings] = useState<SecondaryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'roi'>('date');

  useEffect(() => {
    fetchListings();
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchListings = async () => {
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
          ),
          profiles!inner (
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load secondary market listings');
    }
  };

  const fetchMyListings = async () => {
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
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyListings(data || []);
    } catch (error) {
      console.error('Error fetching my listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateROI = (listing: SecondaryListing) => {
    if (!listing.cask_ownership?.acquisition_price) return 0;
    const originalPrice = listing.cask_ownership.acquisition_price;
    const currentPrice = listing.total_asking_price;
    return ((currentPrice - originalPrice) / originalPrice) * 100;
  };

  const filteredListings = listings
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

  const cancelListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('cask_sales')
        .update({ status: 'cancelled' })
        .eq('id', listingId)
        .eq('seller_id', user?.id);

      if (error) throw error;
      
      toast.success('Listing cancelled');
      fetchMyListings();
    } catch (error) {
      console.error('Error cancelling listing:', error);
      toast.error('Failed to cancel listing');
    }
  };

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
            <RefreshCw className="h-8 w-8 text-blue-500" />
            Secondary Market
          </h1>
          <p className="text-muted-foreground">
            Buy and sell cask ownership with full blockchain transparency
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchListings()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/portfolio'}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Portfolio
          </Button>
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Listings</TabsTrigger>
          <TabsTrigger value="my-listings">My Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Sorting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by spirit name or distillery..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Input
                    type="number"
                    placeholder="Max price per liter"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="date">Newest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="roi">Highest ROI</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
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
                      {listing.cask_ownership?.casks?.distilleries?.verified && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
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
                          {roi >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Distillery: {listing.cask_ownership?.casks?.distilleries?.name}</div>
                      <div>Seller: {listing.profiles?.first_name} {listing.profiles?.last_name}</div>
                      <div>Listed: {new Date(listing.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Buy Now
                      </Button>
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>

                    {listing.cask_ownership?.casks?.blockchain_hash && (
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        Blockchain: {listing.cask_ownership.casks.blockchain_hash}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredListings.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-listings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map((listing) => (
              <Card key={listing.id}>
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
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                      {listing.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Asking Price</span>
                      <span className="font-bold">£{listing.asking_price_per_liter}/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="font-semibold">£{listing.total_asking_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Volume</span>
                      <span>{listing.volume_for_sale_liters}L</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Listed: {new Date(listing.created_at).toLocaleDateString()}
                  </div>

                  {listing.status === 'active' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => cancelListing(listing.id)}
                      >
                        Cancel Listing
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {myListings.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No active listings</h3>
                <p className="text-muted-foreground mb-4">
                  Start selling your cask ownership from your portfolio
                </p>
                <Button onClick={() => window.location.href = '/portfolio'}>
                  View Portfolio
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecondaryMarket;