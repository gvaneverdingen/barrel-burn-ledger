-- Add foreign key relationship between wishlist and casks
ALTER TABLE public.wishlist 
ADD CONSTRAINT fk_wishlist_cask 
FOREIGN KEY (cask_id) REFERENCES public.casks(id) ON DELETE CASCADE;

-- Add foreign key relationship between wishlist and profiles (users)
ALTER TABLE public.wishlist 
ADD CONSTRAINT fk_wishlist_user 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;