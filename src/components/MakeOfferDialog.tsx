import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Currency, useCurrency } from '@/contexts/CurrencyContext';
import { calculateLPA, calculatePricePerLPA, formatLPA } from '@/utils/lpaCalculations';
import { toast } from 'sonner';
import { MessageSquare, HandCoins, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currencies: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'EUR', label: 'EUR', symbol: '€' },
  { value: 'GBP', label: 'GBP', symbol: '£' },
  { value: 'JPY', label: 'JPY', symbol: '¥' },
];

const sendOfferEmail = async (params: {
  sellerId: string;
  spiritName: string;
  caskNumber: string;
  offerType: string;
  offeredTotalPrice?: string;
  offeredPricePerLiter?: string;
  volumeLiters?: string;
  message?: string;
}) => {
  try {
    const idempotencyKey = `new-offer-${params.sellerId}-${Date.now()}`;

    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'new-offer-notification',
        sellerId: params.sellerId,
        idempotencyKey,
        templateData: {
          spiritName: params.spiritName,
          caskNumber: params.caskNumber,
          offerType: params.offerType,
          offeredTotalPrice: params.offeredTotalPrice,
          offeredPricePerLiter: params.offeredPricePerLiter,
          volumeLiters: params.volumeLiters,
          message: params.message,
        },
      },
    });
  } catch (err) {
    console.error('Failed to send offer notification email:', err);
  }
};

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: {
    id: string;
    cask_id?: string;
    seller_id?: string;
    spirit_name: string;
    cask_number: string;
    current_volume_liters: number;
    alcohol_percentage: number;
    price_per_liter: number;
    total_price: number;
    saleListingId?: string | null;
  };
}

export const MakeOfferDialog = ({ open, onOpenChange, listing }: MakeOfferDialogProps) => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<string>('offer');
  const [offerPricePerLPA, setOfferPricePerLPA] = useState('');
  const [message, setMessage] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lpa = calculateLPA(listing.current_volume_liters, listing.alcohol_percentage);
  const askingPricePerLPA = calculatePricePerLPA(listing.total_price, listing.current_volume_liters, listing.alcohol_percentage);

  const calculateTotalOffer = () => {
    const pricePerLPA = parseFloat(offerPricePerLPA) || 0;
    return pricePerLPA * (lpa || 0);
  };

  // Convert LPA price back to per-liter for DB storage
  const calculatePricePerLiter = () => {
    const pricePerLPA = parseFloat(offerPricePerLPA) || 0;
    if (!listing.alcohol_percentage || listing.alcohol_percentage === 0) return pricePerLPA;
    return pricePerLPA * (listing.alcohol_percentage / 100);
  };

  const handleSubmitOffer = async () => {
    if (!user) {
      toast.error('Please log in to make an offer');
      return;
    }

    if (!offerPricePerLPA) {
      toast.error('Please enter your offer price per LPA');
      return;
    }

    const pricePerLPA = parseFloat(offerPricePerLPA);
    const totalPrice = calculateTotalOffer();
    const pricePerLiter = calculatePricePerLiter();

    if (pricePerLPA <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('offers').insert({
        cask_id: listing.cask_id || listing.id,
        sale_listing_id: listing.saleListingId ?? null,
        buyer_id: user.id,
        seller_id: listing.seller_id!,
        offer_type: 'buy_offer',
        offered_price_per_liter: pricePerLiter,
        offered_total_price: totalPrice,
        volume_liters: listing.current_volume_liters,
        message: message || null,
        status: 'pending'
      });

      if (error) throw error;

      sendOfferEmail({
        sellerId: listing.seller_id!,
        spiritName: listing.spirit_name,
        caskNumber: listing.cask_number,
        offerType: 'buy_offer',
        offeredTotalPrice: totalPrice.toLocaleString(),
        offeredPricePerLiter: pricePerLPA.toLocaleString(),
        volumeLiters: listing.current_volume_liters?.toString(),
        message: message || undefined,
      });

      toast.success('Offer submitted successfully! The seller will be notified.');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!user) {
      toast.error('Please log in to send an enquiry');
      return;
    }

    if (!enquiryMessage.trim()) {
      toast.error('Please enter your question');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('offers').insert({
        cask_id: listing.cask_id || listing.id,
        sale_listing_id: listing.saleListingId ?? null,
        buyer_id: user.id,
        seller_id: listing.seller_id!,
        offer_type: 'enquiry',
        offered_price_per_liter: 0,
        offered_total_price: 0,
        volume_liters: listing.current_volume_liters || 0,
        message: enquiryMessage,
        status: 'pending'
      });

      if (error) throw error;

      sendOfferEmail({
        sellerId: listing.seller_id!,
        spiritName: listing.spirit_name,
        caskNumber: listing.cask_number,
        offerType: 'enquiry',
        message: enquiryMessage,
      });

      toast.success('Enquiry sent! The seller will respond shortly.');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to send enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOfferPricePerLPA('');
    setMessage('');
    setEnquiryMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Interested in this cask?</DialogTitle>
          <DialogDescription>
            {listing.spirit_name} — Cask #{listing.cask_number}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offer" className="flex items-center gap-1.5">
              <HandCoins className="h-4 w-4" />
              Make an Offer
            </TabsTrigger>
            <TabsTrigger value="enquiry" className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              Ask a Question
            </TabsTrigger>
          </TabsList>

          {/* Make an Offer Tab */}
          <TabsContent value="offer" className="space-y-4 mt-4">
            {/* Current Listing Price */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Asking Price (per Cask)</span>
                <span className="font-semibold">{formatPrice(listing.total_price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Price per LPA</span>
                <span className="font-semibold">{formatPrice(askingPricePerLPA)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">LPA</span>
                <span className="font-semibold">{formatLPA(lpa)}</span>
              </div>
            </div>

            {/* Offer Price Per LPA */}
            <div className="space-y-2">
              <Label htmlFor="offerPrice">Your Offer Price per LPA</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="offerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter your offer price per LPA"
                  value={offerPricePerLPA}
                  onChange={(e) => setOfferPricePerLPA(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Total Offer Price */}
            {offerPricePerLPA && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Your Total Offer (per Cask)</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(calculateTotalOffer())}
                  </span>
                </div>
              </div>
            )}

            {/* Optional Message */}
            <div className="space-y-2">
              <Label htmlFor="offerMessage">Message to Seller (Optional)</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="offerMessage"
                  placeholder="E.g. 'Would you consider a lower price for bulk?'"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="pl-9 min-h-[80px]"
                  maxLength={500}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitOffer}
                disabled={isSubmitting || !offerPricePerLPA}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Offer'}
              </Button>
            </div>
          </TabsContent>

          {/* Ask a Question Tab */}
          <TabsContent value="enquiry" className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                Have questions before making an offer? Ask the seller about provenance, tasting notes, storage conditions, or anything else about this cask.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Listed at</span>
                <span className="font-semibold">{formatPrice(listing.total_price)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Common questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'What are the tasting notes?',
                  'Is there a sample available?',
                  'What is the storage history?',
                  'Can you share provenance docs?',
                ].map((q) => (
                  <Button
                    key={q}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setEnquiryMessage((prev) => prev ? `${prev}\n${q}` : q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enquiry">Your Question</Label>
              <Textarea
                id="enquiry"
                placeholder="Write your question to the seller..."
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                className="min-h-[120px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {enquiryMessage.length}/1000 characters
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEnquiry}
                disabled={isSubmitting || !enquiryMessage.trim()}
              >
                {isSubmitting ? 'Sending...' : 'Send Enquiry'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
