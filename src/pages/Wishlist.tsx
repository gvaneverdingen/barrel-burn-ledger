import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateLPA, calculatePricePerLPA, formatLPA } from '@/utils/lpaCalculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Heart, Search, Filter, TrendingUp, Bell, Plus, Trash2, MapPin, Droplets, Gauge, Calendar } from 'lucide-react';

interface WishlistItem {
  id: string;
  user_id: string;
  cask_id: string;
  max_price: number;
  notes: string | null;
  created_at: string;
  // Joined cask data
  casks?: {
    id: string;
    spirit_name: string;
    cask_number: string;
    price_per_liter: number | null;
    current_volume_liters: number | null;
    total_price: number | null;
    available_for_sale: boolean | null;
    distilleries: {
      name: string;
      location: string | null;
    } | null;
  } | null;
}

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          casks!inner (
            id,
            spirit_name,
            cask_number,
            price_per_liter,
            current_volume_liters,
            total_price,
            available_for_sale,
            distilleries (
              name,
              location
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filter out any items without valid cask data
      const validItems = (data || []).filter(item => item.casks && item.casks.spirit_name);
      setWishlistItems(validItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const checkForMatches = async () => {
    try {
      // Check if any casks now match wishlist criteria
      const availableMatches = wishlistItems.filter(item => 
        item.casks?.available_for_sale && 
        item.casks?.price_per_liter <= item.max_price
      );

      if (availableMatches.length > 0) {
        toast.success(`${availableMatches.length} matches found! Check your wishlist.`);
      } else {
        toast.info('No new matches found');
      }
    } catch (error) {
      console.error('Error checking matches:', error);
    }
  };

  const filteredItems = wishlistItems.filter(item => {
    // Safety check - skip items without cask data
    if (!item.casks) return false;
    
    const matchesSearch = 
      (item.casks.spirit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.casks.distilleries?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesPrice = maxPrice === '' || (item.casks.price_per_liter || 0) <= Number(maxPrice);
    return matchesSearch && matchesPrice;
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
            <Heart className="h-8 w-8 text-red-500" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground">
            Track your favorite casks and get notified when they match your criteria
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkForMatches} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Check Matches
          </Button>
          <Button onClick={() => window.location.href = '/marketplace'}>
            <Plus className="h-4 w-4 mr-2" />
            Browse Marketplace
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by spirit name or distillery..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
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
          </div>
        </CardContent>
      </Card>

      {/* Wishlist Items */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-4">
              Start adding casks to your wishlist from the marketplace
            </p>
            <Button onClick={() => window.location.href = '/marketplace'}>
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {item.casks?.spirit_name}
                    </CardTitle>
                    <CardDescription>
                      Cask #{item.casks?.cask_number} • {item.casks?.distilleries?.name}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromWishlist(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Price</span>
                  <span className="font-semibold">
                    £{item.casks?.price_per_liter}/L
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Max Price</span>
                  <span className="font-semibold text-green-600">
                    £{item.max_price}/L
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Volume</span>
                  <span>{item.casks?.current_volume_liters}L</span>
                </div>
                
                {/* Price Match Indicator */}
                {item.casks?.available_for_sale && (item.casks?.price_per_liter ?? 0) <= item.max_price && (
                  <Badge className="w-full bg-green-100 text-green-800 justify-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Price Match Available!
                  </Badge>
                )}
                
                {!item.casks?.available_for_sale && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Not Available
                  </Badge>
                )}

                {item.notes && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Notes:</strong> {item.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.location.href = `/cask/${item.cask_id}`}
                  >
                    View Details
                  </Button>
                   {item.casks?.available_for_sale && (item.casks?.price_per_liter ?? 0) <= item.max_price && (
                    <Button size="sm" variant="outline">
                      Buy Now
                    </Button>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;