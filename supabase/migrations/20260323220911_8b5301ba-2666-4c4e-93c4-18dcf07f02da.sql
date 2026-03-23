-- Re-add public read access for verified distilleries (safe fields only enforced at query level)
-- The distilleries_public view provides column-level restriction for direct access
-- But joins from casks table need the base table to be readable
CREATE POLICY "Public can view verified distilleries for joins"
ON public.distilleries
FOR SELECT
TO anon
USING (verified = true);