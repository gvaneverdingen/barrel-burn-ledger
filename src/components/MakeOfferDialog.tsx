import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { DollarSign, MessageSquare } from 'lucide-react';

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
    price_per_liter: number;
    total_price: number;
    saleListingId?: string | null;
  };
}

export const MakeOfferDialog = ({ open, onOpenChange, listing }: MakeOfferDialogProps) => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [offerPricePerLiter, setOfferPricePerLiter] = useState('');
  const [offerVolume, setOfferVolume] = useState(listing.current_volume_liters?.toString() || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotalPrice = () => {
    const pricePerLiter = parseFloat(offerPricePerLiter) || 0;
    const volume = parseFloat(offerVolume) || 0;
    return pricePerLiter * volume;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to make an offer');
      return;
    }

    if (!offerPricePerLiter || !offerVolume) {
      toast.error('Please enter offer price and volume');
      return;
    }

    const pricePerLiter = parseFloat(offerPricePerLiter);
    const volume = parseFloat(offerVolume);
    const totalPrice = calculateTotalPrice();

    if (pricePerLiter <= 0 || volume <= 0) {
      toast.error('Price and volume must be greater than 0');
      return;
    }

    if (volume > (listing.current_volume_liters || 0)) {
      toast.error(`Volume cannot exceed ${listing.current_volume_liters}L`);
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
        volume_liters: volume,
        message: message || null,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Offer submitted successfully!');
      onOpenChange(false);
      
      // Reset form
      setOfferPricePerLiter('');
      setOfferVolume(listing.current_volume_liters?.toString() || '');
      setMessage('');
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>
            Submit your offer for {listing.spirit_name} - {listing.cask_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Listing Price */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Current Asking Price</span>
              <span className="font-semibold">{formatPrice(listing.price_per_liter)}/L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Asking Price</span>
              <span className="font-semibold">{formatPrice(listing.total_price)}</span>
            </div>
          </div>

          {/* Offer Price Per Liter */}
          <div className="space-y-2">
            <Label htmlFor="offerPrice">Your Offer Price per Liter</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="offerPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter your offer price per liter"
                value={offerPricePerLiter}
                onChange={(e) => setOfferPricePerLiter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <Label htmlFor="volume">
              Volume (Liters) - Max: {listing.current_volume_liters}L
            </Label>
            <Input
              id="volume"
              type="number"
              step="0.1"
              min="0"
              max={listing.current_volume_liters || undefined}
              placeholder="Enter volume"
              value={offerVolume}
              onChange={(e) => setOfferVolume(e.target.value)}
            />
          </div>

          {/* Total Offer Price */}
          {offerPricePerLiter && offerVolume && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Your Total Offer</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(calculateTotalPrice())}
                </span>
              </div>
            </div>
          )}

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="message"
                placeholder="Add a message to the seller..."
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
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !offerPricePerLiter || !offerVolume}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Offer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
