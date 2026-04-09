
-- 1. FIX: audit_logs - replace authenticated INSERT with service_role only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "service_role_insert_audit_logs"
  ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. FIX: blockchain_logs - restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view blockchain logs" ON public.blockchain_logs;
CREATE POLICY "Authenticated users can view blockchain logs"
  ON public.blockchain_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. FIX: distilleries - replace broad authenticated SELECT with column-safe approach
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view verified distilleries" ON public.distilleries;

-- Re-create using distilleries_public view approach is not viable via RLS alone,
-- so we create a restrictive policy that only returns safe columns.
-- Since RLS can't restrict columns, we use a SECURITY DEFINER function approach.
-- Instead, we keep the policy but ensure the app uses the distilleries_public view.
-- For now, the owner and admin policies already grant full access.
-- We'll create a new restricted policy for general authenticated users.

-- Actually, we need to revoke direct SELECT for authenticated and route through the view.
-- But RLS policies are additive, so we just need to remove the broad one.
-- The distilleries_public view already excludes sensitive columns.
-- Owners see their own data via "Distillery owners can view their complete data" policy.
-- Admins see all via "Admins can manage all distilleries" policy.
-- For marketplace display, the distilleries_public view should be used.

-- 4. FIX: storage cask-images - tighten upload policy
DROP POLICY IF EXISTS "Authenticated users can upload cask images" ON storage.objects;
CREATE POLICY "Distillery owners can upload cask images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cask-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
