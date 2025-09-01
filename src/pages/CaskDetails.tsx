import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Droplets, Gauge, DollarSign, Wine, Building, Hash, Shield } from "lucide-react";
import caskDetailImage from "@/assets/cask-detail.jpg";
import singleCask from "@/assets/single-cask.jpg";
import { CaskImageGallery } from "@/components/CaskImageGallery";
import { CaskImageUpload } from "@/components/CaskImageUpload";

interface CaskDetails {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillation_date: string;
  current_volume_liters: number;
  alcohol_percentage: number;
  price_per_liter: number;
  total_price: number;
  available_for_sale: boolean;
  warehouse_location: string;
  tasting_notes: string;
  blockchain_id: string;
  blockchain_hash: string;
  expected_maturation_years: number;
  created_at: string;
  original_cask_type: string;
  finishing_cask_type: string;
  finishing_duration_months: number;
  finishing_notes: string;
  has_been_finished: boolean;
  distillery: {
    id: string;
    name: string;
    location: string;
    description: string;
    established_year: number;
    verified: boolean;
  };
  cask_type: {
    id: string;
    name: string;
    capacity_liters: number;
    description: string;
  };
  // Optional sale-related fields
  is_sale_listing?: boolean;
  sale_id?: string;
  seller?: {
    first_name?: string;
    last_name?: string;
  };
}

const CaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cask, setCask] = useState<CaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);
  const [canManageImages, setCanManageImages] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCaskDetails(id);
    }
  }, [id]);

  useEffect(() => {
    if (cask && user) {
      checkImageManagementPermissions();
    }
  }, [cask, user]);

  const checkImageManagementPermissions = async () => {
    if (!cask || !user) return;

    try {
      // Check if the user owns this cask through their distillery
      const { data, error } = await supabase
        .from('distilleries')
        .select('id')
        .eq('profile_id', user.id)
        .eq('id', cask.distillery.id)
        .single();

      if (!error && data) {
        setCanManageImages(true);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const handleImageUploaded = () => {
    setImageRefreshTrigger(prev => prev + 1);
  };

  const fetchCaskDetails = async (caskId: string) => {
    try {
      const { data, error } = await supabase
        .from("casks")
        .select(`
          *,
          distillery:distilleries(
            id,
            name,
            location,
            description,
            established_year,
            verified
          ),
          cask_type:cask_types(
            id,
            name,
            capacity_liters,
            description
          )
        `)
        .eq("id", caskId)
        .eq("available_for_sale", true)
        .single();

      if (error) throw error;

      // Check if this cask has an active sale listing by finding ownership records first
      console.log('Checking ownership for cask:', caskId);
      const { data: ownershipData } = await supabase
        .from('cask_ownership')
        .select('id')
        .eq('cask_id', caskId)
        .eq('is_active', true);

      console.log('Ownership data found:', ownershipData);

      let activeSale = null;
      if (ownershipData && ownershipData.length > 0) {
        // Check if any of these ownership records have active sales
        const ownershipIds = ownershipData.map(o => o.id);
        console.log('Looking for sales with ownership IDs:', ownershipIds);
        
        const { data: salesForCask } = await supabase
          .from('cask_sales')
          .select(`
            id,
            asking_price_per_liter,
            total_asking_price,
            volume_for_sale_liters,
            notes,
            seller:profiles(first_name, last_name)
          `)
          .eq('status', 'active')
          .in('ownership_id', ownershipIds);
          
        console.log('Sales data found:', salesForCask);
        activeSale = salesForCask && salesForCask.length > 0 ? salesForCask[0] : null;
      }

      console.log('Active sale:', activeSale);

      // If there's an active sale, override the pricing
      let finalCaskData = data;
      if (activeSale) {
        console.log('Overriding prices with sale data:', {
          original_total: data.total_price,
          original_per_liter: data.price_per_liter,
          sale_total: activeSale.total_asking_price,
          sale_per_liter: activeSale.asking_price_per_liter
        });
        
        finalCaskData = {
          ...data,
          price_per_liter: Number(activeSale.asking_price_per_liter),
          total_price: Number(activeSale.total_asking_price),
          current_volume_liters: Number(activeSale.volume_for_sale_liters),
          // Add sale metadata
          is_sale_listing: true,
          sale_id: activeSale.id,
          seller: activeSale.seller
        } as any;
      } else {
        console.log('No active sale found, using original cask prices:', {
          total_price: data.total_price,
          price_per_liter: data.price_per_liter
        });
      }

      // Set debug info for mobile display
      setDebugInfo({
        caskId,
        hasOwnership: ownershipData?.length > 0,
        ownershipCount: ownershipData?.length || 0,
        hasSale: !!activeSale,
        originalPrice: data.total_price,
        finalPrice: finalCaskData.total_price,
        salePrice: activeSale?.total_asking_price || 'none'
      });

      setCask(finalCaskData as CaskDetails);
    } catch (error: any) {
      console.error("Error fetching cask details:", error);
      toast({
        title: "Error",
        description: "Failed to load cask details. Please try again.",
        variant: "destructive",
      });
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (distillationDate: string) => {
    const now = new Date();
    const distilled = new Date(distillationDate);
    return Math.floor((now.getTime() - distilled.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate price per liter at 100% alcohol strength (ASL)
  const calculatePricePerLiterASL = (pricePerLiter: number, alcoholPercentage: number) => {
    if (!alcoholPercentage || alcoholPercentage === 0) return pricePerLiter;
    return pricePerLiter / (alcoholPercentage / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  const handlePurchaseClick = async () => {
    console.log('Purchase click - User:', user);
    
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    console.log('User data being sent to payment:', {
      userId: user.id,
      userEmail: user.email,
      caskId: cask?.id,
      amount: Math.round((cask?.total_price || 0) * 100)
    });

    try {
      console.log('Attempting to call create-payment function...');
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          caskId: cask?.id,
          amount: Math.round((cask?.total_price || 0) * 100), // Convert to cents
          currency: 'usd',
          caskName: cask?.spirit_name,
          userId: user.id,
          userEmail: user.email,
        }
      });

      console.log('Payment function response:', { data, error });

      if (error) {
        console.error('Payment function returned error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Payment function error');
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No payment URL returned');
        throw new Error('No payment URL returned');
      }
    } catch (error) {
      console.error('Payment process failed:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to start payment process. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || errorMessage;
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
          <Card>
            <CardContent className="text-center py-12">
              <h4 className="text-lg font-medium mb-2">Cask not found</h4>
              <p className="text-muted-foreground">The requested cask could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          {/* Always visible debug info */}
          {debugInfo && (
            <div className="bg-yellow-100 text-yellow-800 p-4 mb-4 rounded text-xs">
              <div><strong>DEBUG INFO:</strong></div>
              <div>Cask ID: {debugInfo.caskId}</div>
              <div>Has Ownership: {debugInfo.hasOwnership ? 'YES' : 'NO'}</div>
              <div>Ownership Count: {debugInfo.ownershipCount}</div>
              <div>Has Sale: {debugInfo.hasSale ? 'YES' : 'NO'}</div>
              <div>Original Price: ${debugInfo.originalPrice}</div>
              <div>Final Price: ${debugInfo.finalPrice}</div>
              <div>Sale Price: {debugInfo.salePrice}</div>
            </div>
          )}
          
          <Button variant="ghost" asChild className="mb-6">
          <Link to="/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cask Image */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-64 rounded-t-lg overflow-hidden">
                  <img 
                    src={caskDetailImage} 
                    alt="Whisky casks" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-white/30">
                      #{cask.cask_number}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                   <div>
                     <CardTitle className="text-3xl font-bold text-primary">
                       {cask.spirit_name}
                     </CardTitle>
                     <CardDescription className="flex items-center space-x-2 mt-2">
                       <MapPin className="h-4 w-4" />
                       <span>{cask.distillery.name}</span>
                       {cask.distillery.verified && (
                         <Shield className="h-4 w-4 text-green-600" />
                       )}
                       {cask.is_sale_listing && cask.seller && (
                         <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
                           Resale by {cask.seller.first_name} {cask.seller.last_name}
                         </Badge>
                       )}
                     </CardDescription>
                   </div>
                 <div className="text-right">
                   <div className="text-2xl font-bold text-primary">
                     {formatCurrency(cask.total_price)}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     {formatCurrency(cask.price_per_liter)}/L
                   </div>
                   {/* DEBUG INFO */}
                   <div className="text-xs bg-red-100 text-red-800 p-2 mt-2 rounded">
                     <div>Is Sale: {cask.is_sale_listing ? 'YES' : 'NO'}</div>
                     <div>Sale ID: {cask.sale_id || 'None'}</div>
                     <div>Total: ${cask.total_price}</div>
                     <div>Per L: ${cask.price_per_liter}</div>
                     <div>Volume: {cask.current_volume_liters}L</div>
                     {cask.seller && <div>Seller: {cask.seller.first_name} {cask.seller.last_name}</div>}
                   </div>
                 </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-semibold">{calculateAge(cask.distillation_date)} years</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Droplets className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Volume</p>
                      <p className="font-semibold">{cask.current_volume_liters}L</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Gauge className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">ABV</p>
                      <p className="font-semibold">{cask.alcohol_percentage}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Wine className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cask Type</p>
                      <p className="font-semibold">{cask.cask_type.name}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Cask Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Distillation Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distillation Date:</span>
                        <span>{formatDate(cask.distillation_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Maturation:</span>
                        <span>{cask.expected_maturation_years} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Warehouse Location:</span>
                        <span>{cask.warehouse_location || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Cask Specifications</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cask Capacity:</span>
                        <span>{cask.cask_type.capacity_liters}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Volume:</span>
                        <span>{cask.current_volume_liters}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fill Level:</span>
                        <span>{Math.round((cask.current_volume_liters / cask.cask_type.capacity_liters) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {cask.tasting_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Tasting Notes</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cask.tasting_notes}
                    </p>
                  </div>
                )}

                {cask.cask_type.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Cask Type Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cask.cask_type.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="h-5 w-5" />
                  <span>Blockchain Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Blockchain ID</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">{cask.blockchain_id}</p>
                  </div>
                  {cask.blockchain_hash && (
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Hash</p>
                      <p className="font-mono text-sm bg-muted p-2 rounded break-all">{cask.blockchain_hash}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real Barrel Photos */}
            <CaskImageGallery 
              caskId={cask.id} 
              canManage={canManageImages}
              refreshTrigger={imageRefreshTrigger}
            />

            {/* Image Upload for Distillery Owners */}
            {canManageImages && (
              <CaskImageUpload 
                caskId={cask.id}
                onImageUploaded={handleImageUploaded}
                canUpload={canManageImages}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cask Image Card */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img 
                    src={singleCask} 
                    alt="Single whisky cask" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Investment Opportunity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(cask.total_price)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Price per Liter:</span>
                    <span className="font-medium">{formatCurrency(cask.price_per_liter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per Liter (100% ASL):</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(calculatePricePerLiterASL(cask.price_per_liter, cask.alcohol_percentage))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span className="font-medium">{cask.current_volume_liters}L</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>ASL = Alcohol Strength by Liter</p>
                  </div>
                </div>

                {user && userRole !== "distillery" && (
                  <Button 
                    className="w-full" 
                    onClick={handlePurchaseClick}
                    size="lg"
                  >
                    Purchase Cask
                  </Button>
                )}
                
                {!user && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/auth')}
                    size="lg"
                  >
                    Sign In to Purchase
                  </Button>
                )}
                
                {user && userRole === "distillery" && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                    size="lg"
                  >
                    Contact Seller
                  </Button>
                )}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/marketplace">Browse More Casks</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Distillery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Distillery</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{cask.distillery.name}</h3>
                  {cask.distillery.verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{cask.distillery.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Established:</span>
                    <span>{cask.distillery.established_year}</span>
                  </div>
                </div>

                {cask.distillery.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cask.distillery.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaskDetails;