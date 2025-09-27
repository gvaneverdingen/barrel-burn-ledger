-- Create wishlist table for user favorites and price alerts
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cask_id UUID NOT NULL,
  max_price NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cask_id)
);

-- Enable Row Level Security
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own wishlist items" 
ON public.wishlist 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wishlist items" 
ON public.wishlist 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wishlist items" 
ON public.wishlist 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own wishlist items" 
ON public.wishlist 
FOR DELETE 
USING (user_id = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wishlist_updated_at
BEFORE UPDATE ON public.wishlist
FOR EACH ROW
EXECUTE FUNCTION public.update_wishlist_updated_at();

-- Add indexes for better performance
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_cask_id ON public.wishlist(cask_id);
CREATE INDEX idx_wishlist_max_price ON public.wishlist(max_price);