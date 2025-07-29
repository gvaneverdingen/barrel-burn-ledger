-- Add seller_amount column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN seller_amount NUMERIC;

-- Update existing transactions to set seller_amount based on total_amount
UPDATE public.transactions 
SET seller_amount = total_amount * 0.885 
WHERE seller_amount IS NULL;