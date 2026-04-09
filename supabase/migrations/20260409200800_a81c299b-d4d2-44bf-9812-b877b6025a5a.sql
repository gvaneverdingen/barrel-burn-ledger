
-- Re-add the authenticated SELECT for verified distilleries
-- This is needed for marketplace cask->distillery joins to work
-- The app code only selects safe columns (name, location, verified, profile_id)
CREATE POLICY "Authenticated users can view verified distillery info"
  ON public.distilleries
  FOR SELECT
  TO authenticated
  USING (verified = true);
