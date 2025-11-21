import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Droplets, Gauge, DollarSign, Wine, Building, Hash, Shield, Loader2, X } from "lucide-react";
import caskDetailImage from "@/assets/cask-detail.jpg";
import singleCask from "@/assets/single-cask.jpg";
import { CaskImageGallery } from "@/components/CaskImageGallery";
import { CaskImageUpload } from "@/components/CaskImageUpload";

interface CaskDetails {
  id: string;
  spirit_name: string;
  cask_number: string;
  distillation_date: string;
  current_volume_liters: number | null;
  alcohol_percentage: number | null;
  price_per_liter: number | null;
  total_price: number | null;
  available_for_sale: boolean;
  warehouse_location: string | null;
  tasting_notes: string | null;
  blockchain_id: string;
  blockchain_hash: string | null;
  expected_maturation_years: number | null;
  created_at: string;
  original_cask_type: string | null;
  finishing_cask_type: string | null;
  finishing_duration_months: number | null;
  finishing_notes: string | null;
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
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cask, setCask] = useState<CaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);
  const [canManageImages, setCanManageImages] = useState(false);
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const [isOwnerSale, setIsOwnerSale] = useState(false);
  const [cancellingSale, setCancellingSale] = useState(false);
  

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
        .maybeSingle();

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

  const handleCancelSale = async () => {
    if (!activeSaleId || !user) return;
    
    setCancellingSale(true);
    try {
      const { error } = await supabase
        .from("cask_sales")
        .update({ status: "cancelled" })
        .eq("id", activeSaleId)
        .eq("seller_id", user.id);

      if (error) throw error;

      toast({
        title: "Sale Cancelled",
        description: "Your cask listing has been removed from the marketplace.",
      });

      // Redirect to portfolio after cancellation
      navigate('/portfolio');
    } catch (error) {
      console.error('Error cancelling sale:', error);
      toast({
        title: "Error",
        description: "Failed to cancel the sale listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingSale(false);
    }
  };

  const fetchCaskDetails = async (caskId: string) => {
    try {
      // First, check for active resale listings - this should be the priority
      const { data: saleData, error: saleError } = await supabase
        .from('cask_sales')
        .select(`
          id,
          asking_price_per_liter,
          total_asking_price,
          volume_for_sale_liters,
          notes,
          ownership:cask_ownership(
            id,
            cask_id,
            profiles:profiles(first_name, last_name),
            cask:casks(
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
            )
          )
        `)
        .eq('status', 'active')
        .eq('ownership.cask_id', caskId)
        .maybeSingle();

      if (saleData?.ownership?.cask) {
        // This is a resale listing - use resale pricing
        const caskInfo = saleData.ownership.cask;
        const finalCaskData = {
          ...caskInfo,
          // Override with resale pricing
          price_per_liter: Number(saleData.asking_price_per_liter),
          total_price: Number(saleData.total_asking_price),
          current_volume_liters: Number(saleData.volume_for_sale_liters),
          tasting_notes: saleData.notes || caskInfo.tasting_notes,
          // Add sale metadata
          is_sale_listing: true,
          sale_id: saleData.id,
          seller: saleData.ownership.profiles
        } as CaskDetails;

        setActiveSaleId(saleData.id);
        
        // Check if current user owns this sale listing
        if (user) {
          const { data: saleOwnerData } = await supabase
            .from('cask_sales')
            .select('seller_id')
            .eq('id', saleData.id)
            .single();
          
          if (saleOwnerData?.seller_id === user.id) {
            setIsOwnerSale(true);
          }
        }

        setCask(finalCaskData);
        return;
      }

      // If no active resale, fetch original cask data
      const { data: caskData, error: caskError } = await supabase
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

      if (caskError) throw caskError;

      setCask({
        ...caskData,
        is_sale_listing: false
      } as CaskDetails);

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


  // Calculate price per liter at 100% alcohol strength (ASL)
  const calculatePricePerLiterASL = (pricePerLiter: number | null, alcoholPercentage: number | null) => {
    if (!pricePerLiter || !alcoholPercentage || alcoholPercentage === 0) return pricePerLiter || 0;
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

    setPurchasing(true);

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
        setPurchasing(false);
        throw new Error(error.message || 'Payment function error');
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        
        // Show toast to inform user about redirect
        toast({
          title: "Redirecting to Payment",
          description: "Opening Stripe checkout in a new window...",
        });

        // Open Stripe checkout in new window
        const stripeWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
        
        // Check if popup was blocked
        if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed === 'undefined') {
          setPurchasing(false);
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site to complete your purchase.",
            variant: "destructive",
          });
        } else {
          // Keep purchasing state active and show message
          toast({
            title: "Payment Window Opened",
            description: "Complete your payment in the new window. After payment, you'll be redirected to your portfolio.",
          });
          
          // Reset purchasing state after a delay
          setTimeout(() => {
            setPurchasing(false);
          }, 3000);
        }
      } else {
        console.error('No payment URL returned');
        setPurchasing(false);
        throw new Error('No payment URL returned');
      }
    } catch (error) {
      console.error('Payment process failed:', error);
      setPurchasing(false);
      
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
                     {formatPrice(cask.total_price || 0)}
                   </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(cask.price_per_liter || 0)}/L
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
                      <p className="font-semibold">{cask.current_volume_liters || 0}L</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Gauge className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">ABV</p>
                      <p className="font-semibold">{cask.alcohol_percentage || 0}%</p>
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
                        <span>{cask.expected_maturation_years || 'N/A'} years</span>
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
                        <span>{cask.current_volume_liters || 0}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fill Level:</span>
                        <span>{cask.current_volume_liters && cask.cask_type.capacity_liters ? Math.round((cask.current_volume_liters / cask.cask_type.capacity_liters) * 100) : 0}%</span>
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
                    {formatPrice(cask.total_price || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Price per Liter:</span>
                    <span className="font-medium">{formatPrice(cask.price_per_liter || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per Liter (100% ASL):</span>
                    <span className="font-bold text-primary">
                      {formatPrice(calculatePricePerLiterASL(cask.price_per_liter, cask.alcohol_percentage))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span className="font-medium">{cask.current_volume_liters || 0}L</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>ASL = Alcohol Strength by Liter</p>
                  </div>
                </div>

                {user && userRole !== "distillery" && !isOwnerSale && (
                  <Button 
                    className="w-full" 
                    onClick={handlePurchaseClick}
                    size="lg"
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening Payment...
                      </>
                    ) : (
                      'Purchase Cask'
                    )}
                  </Button>
                )}

                {isOwnerSale && (
                  <Button 
                    variant="outline"
                    className="w-full border-red-500/20 text-red-600 hover:bg-red-500/10" 
                    onClick={handleCancelSale}
                    size="lg"
                    disabled={cancellingSale}
                  >
                    {cancellingSale ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Cancel Sale
                      </>
                    )}
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