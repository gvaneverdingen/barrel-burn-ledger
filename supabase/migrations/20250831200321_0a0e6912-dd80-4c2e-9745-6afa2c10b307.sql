-- Create table for cask sales listings
CREATE TABLE public.cask_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ownership_id UUID NOT NULL REFERENCES public.cask_ownership(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  asking_price_per_liter NUMERIC NOT NULL,
  total_asking_price NUMERIC NOT NULL,
  volume_for_sale_liters NUMERIC NOT NULL,
  listing_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cask_sales ENABLE ROW LEVEL SECURITY;

-- Create policies for cask sales
CREATE POLICY "Anyone can view active cask sales" 
ON public.cask_sales 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Sellers can create their own cask sales" 
ON public.cask_sales 
FOR INSERT 
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own cask sales" 
ON public.cask_sales 
FOR UPDATE 
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own cask sales" 
ON public.cask_sales 
FOR DELETE 
USING (seller_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cask_sales_updated_at
BEFORE UPDATE ON public.cask_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_cask_sales_status ON public.cask_sales(status);
CREATE INDEX idx_cask_sales_seller ON public.cask_sales(seller_id);

-- Update transactions table to support peer-to-peer sales
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS sale_listing_id UUID REFERENCES public.cask_sales(id),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;