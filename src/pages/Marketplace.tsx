import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, MapPin, Calendar, BarChart3, Grape, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  distillery: {
    name: string;
    location: string;
  };
  cask_type: {
    name: string;
    capacity_liters: number;
  };
}

const Marketplace = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const [casks, setCasks] = useState<Cask[]>([]);
  const [filteredCasks, setFilteredCasks] = useState<Cask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [filterByDistillery, setFilterByDistillery] = useState('all');

  // Redirect to auth if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchCasks();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortCasks();
  }, [casks, searchTerm, sortBy, filterByDistillery]);

  const fetchCasks = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) {
        toast({
          title: "Error loading casks",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setCasks(data || []);
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

  if (loading || isLoading) {
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
          <div className="flex items-center space-x-2">
            <Grape className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Unicask</h1>
            <span className="text-muted-foreground">|</span>
            <h2 className="text-lg font-medium text-foreground">Marketplace</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Premium Whisky Cask Marketplace
          </h3>
          <p className="text-lg text-muted-foreground">
            Discover and invest in authenticated whisky casks from verified distilleries
          </p>
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
              <Grape className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
              <Card key={cask.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{cask.spirit_name}</CardTitle>
                      <CardDescription className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{cask.distillery?.name}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">#{cask.cask_number}</Badge>
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
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{cask.cask_type?.name}</p>
                    </div>
                  </div>

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
                    <div className="text-sm text-muted-foreground mb-4">
                      {formatCurrency(cask.price_per_liter)} per liter
                    </div>
                    
                    {(userRole === 'consumer' || userRole === 'investor') && (
                      <Button className="w-full">
                        View Details & Purchase
                      </Button>
                    )}
                    
                    {userRole === 'distillery' && (
                      <Button variant="outline" className="w-full" disabled>
                        Contact Seller
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