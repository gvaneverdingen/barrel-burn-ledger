import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { HandCoins, Send, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from './ui/loading-spinner';

interface Offer {
  id: string;
  cask_id: string;
  sale_listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  offer_type: string;
  offered_price_per_liter: number;
  offered_total_price: number;
  volume_liters: number;
  status: string;
  message: string | null;
  created_at: string;
  expires_at: string | null;
  buyer_profile?: { first_name: string; last_name: string; email: string };
  seller_profile?: { first_name: string; last_name: string; email: string };
  cask?: {
    spirit_name: string;
    cask_number: string;
    distillery: { name: string };
  };
}

export const OffersPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchOffers();
    }
  }, [authLoading, user]);

  const fetchOffers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch received offers (where I'm the seller)
      const { data: received, error: receivedError } = await supabase
        .from('offers')
        .select(`
          *,
          buyer_profile:profiles!offers_buyer_id_fkey(first_name, last_name, email),
          cask:casks(
            spirit_name,
            cask_number,
            distillery:distilleries(name)
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch sent offers (where I'm the buyer)
      const { data: sent, error: sentError } = await supabase
        .from('offers')
        .select(`
          *,
          seller_profile:profiles!offers_seller_id_fkey(first_name, last_name, email),
          cask:casks(
            spirit_name,
            cask_number,
            distillery:distilleries(name)
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      setReceivedOffers(received || []);
      setSentOffers(sent || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: action })
        .eq('id', offerId);

      if (error) throw error;

      toast.success(`Offer ${action === 'accepted' ? 'accepted' : 'rejected'} successfully`);
      fetchOffers();
    } catch (error) {
      console.error(`Error ${action} offer:`, error);
      toast.error(`Failed to ${action} offer`);
    }
  };

  const withdrawOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', offerId);

      if (error) throw error;

      toast.success('Offer withdrawn successfully');
      fetchOffers();
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      toast.error('Failed to withdraw offer');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      accepted: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      withdrawn: { variant: 'outline', icon: XCircle },
      expired: { variant: 'outline', icon: Clock },
    };

    const { variant, icon: Icon } = variants[status] || variants.pending;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderOfferCard = (offer: Offer, isReceived: boolean) => (
    <Card key={offer.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {offer.cask?.spirit_name || 'Unknown Cask'}
            </CardTitle>
            <CardDescription>
              Cask #{offer.cask?.cask_number} • {offer.cask?.distillery?.name}
            </CardDescription>
          </div>
          {getStatusBadge(offer.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Offer Price/L</p>
            <p className="font-semibold">{formatCurrency(offer.offered_price_per_liter)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Offer</p>
            <p className="font-semibold">{formatCurrency(offer.offered_total_price)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="font-semibold">{offer.volume_liters}L</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isReceived ? 'From' : 'To'}
            </p>
            <p className="font-semibold">
              {isReceived
                ? `${offer.buyer_profile?.first_name || 'Unknown'} ${offer.buyer_profile?.last_name || ''}`
                : `${offer.seller_profile?.first_name || 'Unknown'} ${offer.seller_profile?.last_name || ''}`}
            </p>
          </div>
        </div>

        {offer.message && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm">{offer.message}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Submitted {new Date(offer.created_at).toLocaleDateString()}
          {offer.expires_at && ` • Expires ${new Date(offer.expires_at).toLocaleDateString()}`}
        </p>

        {offer.status === 'pending' && (
          <div className="flex gap-2">
            {isReceived ? (
              <>
                <Button
                  size="sm"
                  onClick={() => handleOfferAction(offer.id, 'accepted')}
                  className="flex-1"
                >
                  Accept Offer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOfferAction(offer.id, 'rejected')}
                  className="flex-1"
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => withdrawOffer(offer.id)}
                className="w-full"
              >
                Withdraw Offer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Please sign in to view and manage your offers.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <HandCoins className="h-8 w-8 text-primary" />
          My Offers
        </h1>
        <p className="text-muted-foreground">
          Manage your sent and received offers
        </p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Received ({receivedOffers.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent ({sentOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {receivedOffers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <HandCoins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No received offers</h3>
                <p className="text-muted-foreground">
                  You haven't received any offers yet
                </p>
              </CardContent>
            </Card>
          ) : (
            receivedOffers.map((offer) => renderOfferCard(offer, true))
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {sentOffers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Send className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No sent offers</h3>
                <p className="text-muted-foreground">
                  You haven't made any offers yet
                </p>
              </CardContent>
            </Card>
          ) : (
            sentOffers.map((offer) => renderOfferCard(offer, false))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
