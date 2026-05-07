
-- Allow anonymous visitors to see primary-market casks for the teaser preview.
-- Resale listings (cask_sales) and reviews remain restricted to authenticated users.
CREATE POLICY "Anonymous teaser can view available casks"
ON public.casks
FOR SELECT
TO anon
USING (available_for_sale = true);
