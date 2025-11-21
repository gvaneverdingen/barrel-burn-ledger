-- Create offers table for marketplace negotiations
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cask_id UUID NOT NULL REFERENCES public.casks(id) ON DELETE CASCADE,
  sale_listing_id UUID REFERENCES public.cask_sales(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('buy_offer', 'buy_request')),
  offered_price_per_liter NUMERIC NOT NULL,
  offered_total_price NUMERIC NOT NULL,
  volume_liters NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'counter_offered', 'expired', 'withdrawn')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create counter_offers table for negotiations
CREATE TABLE public.counter_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  counter_price_per_liter NUMERIC NOT NULL,
  counter_total_price NUMERIC NOT NULL,
  counter_volume_liters NUMERIC,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offers
CREATE POLICY "Users can view offers they created"
  ON public.offers FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view offers on their listings"
  ON public.offers FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Users can create offers"
  ON public.offers FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update their own offers"
  ON public.offers FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can update offers on their listings"
  ON public.offers FOR UPDATE
  USING (seller_id = auth.uid());

-- RLS Policies for counter_offers
CREATE POLICY "Offer parties can view counter offers"
  ON public.counter_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = counter_offers.original_offer_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

CREATE POLICY "Sellers can create counter offers"
  ON public.counter_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = counter_offers.original_offer_id
      AND o.seller_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update counter offers"
  ON public.counter_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = counter_offers.original_offer_id
      AND o.buyer_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX idx_offers_seller_id ON public.offers(seller_id);
CREATE INDEX idx_offers_cask_id ON public.offers(cask_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_counter_offers_original_offer_id ON public.counter_offers(original_offer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counter_offers_updated_at
  BEFORE UPDATE ON public.counter_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();