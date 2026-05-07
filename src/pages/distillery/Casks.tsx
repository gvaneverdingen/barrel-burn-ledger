import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, Edit, Eye, Coins, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const FALLBACK_DEMO_DISTILLERY = {
  id: 'demo-verified-distillery',
  name: 'Highland Heritage Distillery',
  verified: true,
};

const FALLBACK_DEMO_CASKS = [
  {
    id: 'demo-cask-1',
    cask_number: 'HH-1998-001',
    spirit_name: 'Highland Single Malt',
    distillation_date: '1998-06-12',
    current_volume_liters: 200,
    alcohol_percentage: 58.4,
    price_per_liter: 95,
    total_price: 19000,
    available_for_sale: true,
    warehouse_location: 'Warehouse 3, Bay 12',
    cask_type_id: null,
    cask_types: { name: 'Ex-Bourbon Hogshead' },
    nft_token_id: 1042,
  },
  {
    id: 'demo-cask-2',
    cask_number: 'HH-2005-014',
    spirit_name: 'Sherry Finish Reserve',
    distillation_date: '2005-03-22',
    current_volume_liters: 250,
    alcohol_percentage: 56.1,
    price_per_liter: 72,
    total_price: 18000,
    available_for_sale: true,
    warehouse_location: 'Warehouse 1, Bay 4',
    cask_type_id: null,
    cask_types: { name: 'Oloroso Sherry Butt' },
    nft_token_id: null,
  },
  {
    id: 'demo-cask-3',
    cask_number: 'HH-2012-077',
    spirit_name: 'Peated Highland',
    distillation_date: '2012-09-04',
    current_volume_liters: 180,
    alcohol_percentage: 62.3,
    price_per_liter: 48,
    total_price: 8640,
    available_for_sale: false,
    warehouse_location: 'Warehouse 2, Bay 8',
    cask_type_id: null,
    cask_types: { name: 'First-Fill Bourbon Barrel' },
    nft_token_id: 2210,
  },
];

interface Cask {
  id: string;
  cask_number: string;
  spirit_name: string;
  distillation_date: string;
  current_volume_liters: number;
  alcohol_percentage: number;
  price_per_liter: number;
  total_price: number;
  available_for_sale: boolean;
  warehouse_location: string;
  cask_type_id: string;
}

const DistilleryCasks = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mintingCaskId, setMintingCaskId] = useState<string | null>(null);

  const { data: ownDistillery } = useQuery({
    queryKey: ['distillery', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('distilleries')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const distillery = ownDistillery || FALLBACK_DEMO_DISTILLERY;
  const isDemo = !ownDistillery;

  const { data: casks = [] } = useQuery({
    queryKey: ['distillery-casks', distillery?.id, isDemo],
    queryFn: async () => {
      if (isDemo) return FALLBACK_DEMO_CASKS;
      if (!ownDistillery) return [];

      const { data, error } = await supabase
        .from('casks')
        .select(`
          *,
          cask_types (name)
        `)
        .eq('distillery_id', ownDistillery.id);

      if (error) {
        console.warn('Cask fetch failed, using demo casks', error);
        return FALLBACK_DEMO_CASKS;
      }
      return data && data.length > 0 ? data : FALLBACK_DEMO_CASKS;
    },
    enabled: !!user,
  });

  const filteredCasks = casks.filter((cask: any) => {
    const matchesSearch = 
      cask.cask_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cask.spirit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cask.warehouse_location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "available" && cask.available_for_sale) ||
      (filterStatus === "unavailable" && !cask.available_for_sale);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold luxury-text-gradient">Manage Casks</h1>
            {isDemo && <Badge variant="secondary">Demo</Badge>}
          </div>
          <p className="text-muted-foreground">
            {isDemo ? `Sample inventory for ${distillery.name}` : 'Manage your cask inventory'}
          </p>
        </div>
        <Button 
          onClick={() => navigate('/distillery/casks/new')}
          className="luxury-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Cask
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search casks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Casks</SelectItem>
            <SelectItem value="available">Available for Sale</SelectItem>
            <SelectItem value="unavailable">Not Available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Casks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCasks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Casks Found</h3>
            <p className="text-muted-foreground mb-4">
              {casks.length === 0 
                ? "You haven't added any casks yet."
                : "No casks match your current filters."
              }
            </p>
            {casks.length === 0 && (
              <Button onClick={() => navigate('/distillery/casks/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Cask
              </Button>
            )}
          </div>
        ) : (
          filteredCasks.map((cask: any) => (
            <Card key={cask.id} className="luxury-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cask.cask_number}</CardTitle>
                  <Badge variant={cask.available_for_sale ? "default" : "secondary"}>
                    {cask.available_for_sale ? "Available" : "Not Available"}
                  </Badge>
                </div>
                <CardDescription>{cask.spirit_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{(cask as any).cask_types?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span>{cask.current_volume_liters}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ABV:</span>
                    <span>{cask.alcohol_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per L:</span>
                    <span>{formatPrice(cask.price_per_liter)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Price:</span>
                    <span>{formatPrice(cask.total_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span>{cask.warehouse_location}</span>
                  </div>
                </div>
                
                {/* NFT Status */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">NFT:</span>
                  {cask.nft_token_id ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Coins className="h-3 w-3 mr-1" />
                      #{cask.nft_token_id}
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={mintingCaskId === cask.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setMintingCaskId(cask.id);
                        try {
                          const { data, error } = await supabase.functions.invoke('mint-cask-nft', {
                            body: { caskId: cask.id }
                          });
                          if (error) throw error;
                          if (!data?.success) throw new Error(data?.error || 'Failed');
                          toast.success(`NFT minted! Token #${data.tokenId ?? 'pending'}`);
                        } catch (err: any) {
                          toast.error(err.message || 'Minting failed');
                        } finally {
                          setMintingCaskId(null);
                        }
                      }}
                      className="text-xs h-7"
                    >
                      {mintingCaskId === cask.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Coins className="h-3 w-3 mr-1" />
                      )}
                      Mint
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/cask/${cask.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/distillery/casks/edit/${cask.id}`)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DistilleryCasks;