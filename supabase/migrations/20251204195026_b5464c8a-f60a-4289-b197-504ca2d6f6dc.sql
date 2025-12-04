-- Allow any authenticated user to create a distillery application
CREATE POLICY "Users can create distillery applications"
ON public.distilleries
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Allow admins to manage all distilleries (for verification)
CREATE POLICY "Admins can manage all distilleries"
ON public.distilleries
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());