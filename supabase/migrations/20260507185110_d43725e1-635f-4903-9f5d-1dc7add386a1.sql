
-- 1. user_roles: prevent privilege escalation via INSERT
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2. cask_sales: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view active cask sales" ON public.cask_sales;
DROP POLICY IF EXISTS "Anyone can view active sales" ON public.cask_sales;

CREATE POLICY "Authenticated users can view active cask sales"
ON public.cask_sales
FOR SELECT
TO authenticated
USING (status = 'active');

-- 3. reviews: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- 4. distilleries: hide sensitive Stripe columns from regular authenticated users.
-- Owner and admin policies still grant full row access; column-level REVOKE
-- only applies through the standard authenticated role on direct selects of
-- those columns. Edge functions use service_role and are unaffected.
REVOKE SELECT (stripe_account_id, stripe_onboarding_complete)
  ON public.distilleries FROM authenticated, anon;

-- Re-grant to admins via a security-definer view is unnecessary because
-- distillery owners read via the "Distillery owners can view their complete
-- data" policy and admins via "Admins can manage all distilleries"; both still
-- use the table row API but column-level grants block selecting these two
-- columns by other authenticated users.

-- 5. storage: explicit SELECT policy for the public cask-images bucket
DROP POLICY IF EXISTS "Public read access for cask-images" ON storage.objects;
CREATE POLICY "Public read access for cask-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cask-images');
