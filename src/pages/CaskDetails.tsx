import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MapPin, Calendar, Droplets, Gauge, DollarSign, Wine, Building, Hash, Shield, Loader2, X, HandCoins, MessageSquare, ShoppingCart } from "lucide-react";
import caskDetailImage from "@/assets/cask-detail.jpg";
import singleCask from "@/assets/single-cask.jpg";
import { CaskImageGallery } from "@/components/CaskImageGallery";
import { CaskImageUpload } from "@/components/CaskImageUpload";
import { MakeOfferDialog } from "@/components/MakeOfferDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NftStatusCard from "@/components/NftStatusCard";

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
  nft_token_id: number | null;
  nft_contract_address: string | null;
  nft_minted_at: string | null;
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isMintingNft, setIsMintingNft] = useState(false);
  
  useEffect(() => {
    console.log('[CaskDetails] useEffect triggered', { id, userId: user?.id });
    if (!id) {
      console.warn('[CaskDetails] No cask ID found in route params');
      setLoading(false);
      return;
    }

    // Try to hydrate from localStorage immediately so the user never sees a blank page
    try {
      const cached = localStorage.getItem("arigi_last_cask");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id === id) {
          console.log("[CaskDetails] Using cached cask details from localStorage");
          setCask(parsed);
        }
      }
    } catch (error) {
      console.warn("[CaskDetails] Failed to read cached cask details", error);
    }

    // Set a safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('[CaskDetails] Loading timeout - forcing loading=false');
      setLoading(false);
      toast({
        title: "Loading timeout",
        description: "The page took too long to load. Please try refreshing.",
        variant: "destructive",
      });
    }, 10000); // 10 second timeout

    fetchCaskDetails(id).finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [id]);

  useEffect(() => {
    console.log('[CaskDetails] Secondary effect for permissions/offers', {
      hasCask: !!cask,
      userId: user?.id,
    });
    if (cask && user) {
      checkImageManagementPermissions();
      fetchOffers();
      checkOwnership();
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
    
    setShowCancelDialog(false);
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

  const fetchOffers = async () => {
    if (!cask || !user) return;

    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          buyer_profile:profiles!offers_buyer_id_fkey(first_name, last_name, email),
          seller_profile:profiles!offers_seller_id_fkey(first_name, last_name, email)
        `)
        .eq('cask_id', cask.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const checkOwnership = async () => {
    if (!cask || !user) return;

    try {
      // Check if user owns this cask through cask_ownership
      const { data: ownership } = await supabase
        .from('cask_ownership')
        .select('id, owner_id')
        .eq('cask_id', cask.id)
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      // Check if user is the distillery owner
      const { data: distillery } = await supabase
        .from('distilleries')
        .select('id, profile_id')
        .eq('id', cask.distillery.id)
        .maybeSingle();

      const isDistilleryOwner = distillery?.profile_id === user.id;
      const isCaskOwner = !!ownership;

      setIsOwner(isDistilleryOwner || isCaskOwner);

      // Set seller ID based on sale listing or distillery ownership
      if (cask.is_sale_listing && activeSaleId) {
        // For resale listings, get the seller_id from the sale
        const { data: saleData } = await supabase
          .from('cask_sales')
          .select('seller_id')
          .eq('id', activeSaleId)
          .single();
        
        if (saleData?.seller_id) {
          setSellerId(saleData.seller_id);
        }
      } else if (isDistilleryOwner) {
        setSellerId(distillery.profile_id);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('accept-offer', {
        body: { offerId }
      });

      if (error) throw error;

      toast({
        title: "Offer Accepted",
        description: "The transaction has been initiated.",
      });

      fetchOffers();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "Failed to accept offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Offer Rejected",
        description: "The offer has been rejected.",
      });

      fetchOffers();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast({
        title: "Error",
        description: "Failed to reject offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMintNft = useCallback(async () => {
    if (!cask || !user) return;
    setIsMintingNft(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-cask-nft', {
        body: { caskId: cask.id }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Minting failed');

      toast({
        title: "NFT Minted Successfully! 🎉",
        description: `Token #${data.tokenId ?? 'pending'} minted on Polygon. Tx: ${data.transactionHash?.slice(0, 10)}...`,
      });

      // Refresh cask data to show updated NFT status
      if (id) await fetchCaskDetails(id);
    } catch (error: any) {
      console.error('NFT minting error:', error);
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint NFT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMintingNft(false);
    }
  }, [cask, user, id]);

  const fetchCaskDetails = async (caskId: string) => {
    console.log('[CaskDetails] Fetching cask details for ID:', caskId);
    try {
      // First, try to find active resale listing for this cask
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('cask_ownership')
        .select('id')
        .eq('cask_id', caskId)
        .eq('is_active', true)
        .maybeSingle();

      if (ownershipError) {
        console.error('[CaskDetails] Error fetching ownership data:', ownershipError);
      }

      let saleData = null;
      if (ownershipData) {
        console.log('[CaskDetails] Active ownership found, looking for active sale listing', ownershipData);
        const { data, error: saleError } = await supabase
          .from('cask_sales')
          .select(`
            id,
            seller_id,
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
          .eq('ownership_id', ownershipData.id)
          .maybeSingle();
        
        if (saleError) {
          console.error('[CaskDetails] Error fetching sale data:', saleError);
        }

        saleData = data;
      }

      if (saleData?.ownership?.cask) {
        console.log('[CaskDetails] Resale listing detected, building resale cask data');
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
        if (user && saleData.seller_id === user.id) {
          setIsOwnerSale(true);
        }

        setCask(finalCaskData);
        console.log('[CaskDetails] Resale cask data set');
        return;
      }

      console.log('[CaskDetails] No active resale listing, fetching primary cask data');
      // If no active resale, fetch original cask data (may not exist or be accessible due to RLS)
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
        .maybeSingle();

      if (caskError) {
        console.error('[CaskDetails] Error fetching primary cask data:', caskError);
        throw caskError;
      }

      if (!caskData) {
        console.warn('[CaskDetails] Cask not found or not accessible due to RLS', { caskId });
        toast({
          title: "Cask unavailable",
          description: "This cask could not be found or is not accessible.",
        });
        navigate("/marketplace");
        return;
      }

      console.log('[CaskDetails] Primary cask data loaded');
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
      console.log('[CaskDetails] Finished fetching cask details, setting loading=false');
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

    // Cache the current cask details so returning from checkout can render instantly
    try {
      if (cask) {
        localStorage.setItem('arigi_last_cask', JSON.stringify(cask));
      }
    } catch (error) {
      console.warn('[CaskDetails] Failed to cache cask details', error);
    }

    setPurchasing(true);

    let checkoutWindow: Window | null = null;

    // Pre-open a blank checkout window so Stripe can load outside the iframe preview
    try {
      checkoutWindow = window.open("", "_blank");
      if (!checkoutWindow) {
        console.warn("Failed to open checkout window - popup likely blocked");
      }
    } catch (openErr) {
      console.warn("Error opening checkout window", openErr);
      checkoutWindow = null;
    }

    try {
      // Check if this is a resale (peer-to-peer) or primary market purchase
      if (activeSaleId) {
        // This is a resale - use purchase-cask function
        console.log('Processing resale purchase for sale:', activeSaleId);
        
        const { data, error } = await supabase.functions.invoke('purchase-cask', {
          body: {
            saleId: activeSaleId,
          }
        });

        console.log('Purchase-cask response:', { data, error });

        if (error) {
          console.error('Purchase-cask error:', error);
          let errorMessage = 'Failed to process resale purchase.';

          if (error instanceof FunctionsHttpError) {
            try {
              const errorData = await error.context.json();
              if (errorData && typeof (errorData as any).error === 'string') {
                errorMessage = (errorData as any).error;
              }
            } catch (parseError) {
              console.warn('Failed to parse purchase-cask error response', parseError);
            }
          } else if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
          }

          setPurchasing(false);
          if (checkoutWindow) {
            checkoutWindow.close();
            checkoutWindow = null;
          }
          toast({
            title: 'Payment Error',
            description: errorMessage,
            variant: 'destructive',
          });
          return;
        }

        if (data?.url) {
          console.log('Redirecting to Stripe checkout:', data.url);

          if (checkoutWindow) {
            checkoutWindow.location.href = data.url;
            setPurchasing(false);
            return;
          }

          try {
            // Navigate to Stripe checkout in the current window (fallback if popup blocked)
            window.location.assign(data.url);
          } catch (e) {
            console.warn('Stripe redirect failed, attempting fallback window.open', e);
            setPurchasing(false);
            try {
              window.open(data.url, '_blank');
            } catch (openError) {
              console.error('Stripe redirect window.open also failed', openError);
              toast({
                title: 'Payment Redirect Error',
                description: 'We could not redirect you to Stripe. Please open the checkout link manually.',
                variant: 'destructive',
              });
            }
          }
        } else {
          console.error('No payment URL returned from purchase-cask');
          setPurchasing(false);
          if (checkoutWindow) {
            checkoutWindow.close();
            checkoutWindow = null;
          }
          throw new Error('Payment setup failed');
        }
      } else {
        // This is a primary market purchase - use create-payment function
        console.log('Processing primary market purchase');
        
        // Mark that a payment flow has been initiated
        try {
          localStorage.setItem('arigi_pending_payment', JSON.stringify({
            caskId: cask?.id,
            createdAt: Date.now(),
          }));
        } catch (e) {
          console.warn('Unable to write pending payment marker', e);
        }
 
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            caskId: cask?.id,
            amount: Math.round((cask?.total_price || 0) * 100), // Convert to cents
            currency: 'usd',
            caskName: cask?.spirit_name,
          }
        });
 
        console.log('Payment function response:', { data, error });
 
        if (error) {
          console.error('Payment function returned error:', error);
          let errorMessage = 'Payment function error';

          if (error instanceof FunctionsHttpError) {
            try {
              const errorData = await error.context.json();
              if (errorData && typeof (errorData as any).error === 'string') {
                errorMessage = (errorData as any).error;
              }
            } catch (parseError) {
              console.warn('Failed to parse create-payment error response', parseError);
            }
          } else if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
          }

          setPurchasing(false);
          if (checkoutWindow) {
            checkoutWindow.close();
            checkoutWindow = null;
          }
          toast({
            title: 'Payment Error',
            description: errorMessage,
            variant: 'destructive',
          });
          return;
        }
 
        if (data?.url) {
          console.log('Redirecting to Stripe checkout:', data.url);

          if (checkoutWindow) {
            checkoutWindow.location.href = data.url;
            setPurchasing(false);
            return;
          }

          try {
            // Navigate to Stripe checkout in the current window (fallback if popup blocked)
            window.location.assign(data.url);
          } catch (e) {
            console.warn('Stripe redirect failed, attempting fallback window.open', e);
            setPurchasing(false);
            try {
              window.open(data.url, '_blank');
            } catch (openError) {
              console.error('Stripe redirect window.open also failed', openError);
              toast({
                title: 'Payment Redirect Error',
                description: 'We could not redirect you to Stripe. Please open the checkout link manually.',
                variant: 'destructive',
              });
            }
          }
        } else {
          console.error('No payment URL returned');
          setPurchasing(false);
          if (checkoutWindow) {
            checkoutWindow.close();
            checkoutWindow = null;
          }
          throw new Error('No payment URL returned');
        }
      }
    } catch (error) {
      console.error('Payment process failed:', error);
      setPurchasing(false);
      
      if (checkoutWindow) {
        checkoutWindow.close();
        checkoutWindow = null;
      }
      
      let errorMessage = 'Failed to start payment process. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || errorMessage;
      }
      
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (loading && !cask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Loading cask details...</p>
          </div>
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

            {/* Blockchain / NFT Status */}
            <NftStatusCard
              blockchainHash={cask.blockchain_hash}
              nftTokenId={cask.nft_token_id}
              nftContractAddress={cask.nft_contract_address}
              nftMintedAt={cask.nft_minted_at}
              isMinting={isMintingNft}
              onMint={handleMintNft}
              canMint={canManageImages && !cask.nft_token_id}
            />

            {/* Blockchain ID */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="h-5 w-5" />
                  <span>Blockchain ID</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm bg-muted p-2 rounded break-all">{cask.blockchain_id}</p>
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

                {user && userRole !== "distillery" && !isOwnerSale && !isOwner && (
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
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Buy at Asking Price
                      </>
                    )}
                  </Button>
                )}

                {user && sellerId && sellerId !== user.id && !isOwner && (
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => setOfferDialogOpen(true)}
                    size="lg"
                  >
                    <HandCoins className="mr-2 h-4 w-4" />
                    Make an Offer / Enquire
                  </Button>
                )}

                {isOwnerSale && (
                  <Button 
                    variant="outline"
                    className="w-full border-red-500/20 text-red-600 hover:bg-red-500/10" 
                    onClick={() => setShowCancelDialog(true)}
                    size="lg"
                    disabled={cancellingSale}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Sale
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

        {/* Offers Section - Only visible to owner */}
        {isOwner && offers.length > 0 && (
          <div className="container mx-auto px-6 pb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HandCoins className="h-5 w-5" />
                  <span>Offers ({offers.filter((o: any) => o.status === 'pending').length} pending)</span>
                </CardTitle>
                <CardDescription>
                  Review and manage offers for this cask
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">
                      Pending ({offers.filter((o: any) => o.status === 'pending').length})
                    </TabsTrigger>
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pending" className="space-y-4 mt-4">
                    {offers.filter((o: any) => o.status === 'pending').map((offer: any) => (
                      <Card key={offer.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-semibold">
                                {offer.buyer_profile?.first_name} {offer.buyer_profile?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{offer.buyer_profile?.email}</p>
                            </div>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Price/L</p>
                              <p className="font-semibold">{formatPrice(offer.offered_price_per_liter)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Volume</p>
                              <p className="font-semibold">{offer.volume_liters}L</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="font-semibold">{formatPrice(offer.offered_total_price)}</p>
                            </div>
                          </div>
                          {offer.message && (
                            <div className="bg-muted p-3 rounded-lg mb-4">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm">{offer.message}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleAcceptOffer(offer.id)}
                              className="flex-1"
                            >
                              Accept Offer
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleRejectOffer(offer.id)}
                              className="flex-1"
                            >
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {offers.filter((o: any) => o.status === 'pending').length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No pending offers</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="accepted" className="space-y-4 mt-4">
                    {offers.filter((o: any) => o.status === 'accepted').map((offer: any) => (
                      <Card key={offer.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-semibold">
                                {offer.buyer_profile?.first_name} {offer.buyer_profile?.last_name}
                              </p>
                            </div>
                            <Badge variant="default">Accepted</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Price/L</p>
                              <p className="font-semibold">{formatPrice(offer.offered_price_per_liter)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Volume</p>
                              <p className="font-semibold">{offer.volume_liters}L</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="font-semibold">{formatPrice(offer.offered_total_price)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {offers.filter((o: any) => o.status === 'accepted').length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No accepted offers</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="rejected" className="space-y-4 mt-4">
                    {offers.filter((o: any) => o.status === 'rejected').map((offer: any) => (
                      <Card key={offer.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-semibold">
                                {offer.buyer_profile?.first_name} {offer.buyer_profile?.last_name}
                              </p>
                            </div>
                            <Badge variant="destructive">Rejected</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Price/L</p>
                              <p className="font-semibold">{formatPrice(offer.offered_price_per_liter)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Volume</p>
                              <p className="font-semibold">{offer.volume_liters}L</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="font-semibold">{formatPrice(offer.offered_total_price)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {offers.filter((o: any) => o.status === 'rejected').length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No rejected offers</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Make Offer Dialog */}
      {cask && sellerId && (
        <MakeOfferDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          listing={{
            id: cask.id,
            cask_id: cask.id,
            seller_id: sellerId,
            spirit_name: cask.spirit_name,
            cask_number: cask.cask_number,
            current_volume_liters: cask.current_volume_liters || 0,
            price_per_liter: cask.price_per_liter || 0,
            total_price: cask.total_price || 0,
            saleListingId: activeSaleId,
          }}
        />
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Sale Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your cask from the marketplace. You can always list it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Listed</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSale}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancellingSale}
            >
              {cancellingSale ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Sale'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CaskDetails;