-- Create a public-safe view that excludes sensitive fields
CREATE VIEW public.distilleries_public
WITH (security_invoker = on) AS
  SELECT 
    id,
    name,
    location,
    description,
    website,
    logo_url,
    established_year,
    verified,
    created_at,
    profile_id
  FROM public.distilleries;

-- Drop the ineffective/overly broad public policies
DROP POLICY IF EXISTS "Anyone can view verified distilleries" ON public.distilleries;
DROP POLICY IF EXISTS "Public can view basic distillery info" ON public.distilleries;

-- Add a proper public SELECT for verified distilleries (authenticated only)
CREATE POLICY "Authenticated users can view verified distilleries"
  ON public.distilleries
  FOR SELECT
  TO authenticated
  USING (verified = true);