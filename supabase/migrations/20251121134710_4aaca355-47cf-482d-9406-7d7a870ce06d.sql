-- Allow cask owners to view their casks even after they are no longer for sale
CREATE POLICY "Owners can view their purchased casks"
ON public.casks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.cask_ownership co
    WHERE co.cask_id = casks.id
      AND co.owner_id = auth.uid()
      AND co.is_active = true
  )
);
