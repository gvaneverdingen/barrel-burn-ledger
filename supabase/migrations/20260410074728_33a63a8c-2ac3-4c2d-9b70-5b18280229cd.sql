-- 1. FIX: cask_ownership INSERT - restrict to service_role only
DROP POLICY IF EXISTS "Users can insert their own ownership" ON public.cask_ownership;

CREATE POLICY "service_role_insert_ownership"
  ON public.cask_ownership
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. FIX: distilleries - hide sensitive columns from general authenticated users
DROP POLICY IF EXISTS "Authenticated users can view verified distillery info" ON public.distilleries;

REVOKE SELECT ON public.distilleries FROM authenticated;
GRANT SELECT (id, name, description, location, logo_url, website, established_year, verified, profile_id, created_at, updated_at)
  ON public.distilleries TO authenticated;

CREATE POLICY "Authenticated users can view verified distillery info"
  ON public.distilleries
  FOR SELECT
  TO authenticated
  USING (verified = true);