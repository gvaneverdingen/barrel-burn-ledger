-- Add foreign key relationship between cask_sales.seller_id and profiles.id
ALTER TABLE public.cask_sales
ADD CONSTRAINT cask_sales_seller_id_fkey
FOREIGN KEY (seller_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;