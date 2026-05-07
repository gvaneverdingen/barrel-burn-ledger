
CREATE POLICY "Anonymous teaser can view verified distilleries"
ON public.distilleries
FOR SELECT
TO anon
USING (verified = true);
