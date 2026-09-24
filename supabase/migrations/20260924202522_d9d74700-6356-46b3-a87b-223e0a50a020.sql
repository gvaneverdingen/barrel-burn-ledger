CREATE OR REPLACE FUNCTION public.get_my_distillery_license(_distillery_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.license_number FROM public.distilleries d
  WHERE d.id = _distillery_id AND (d.profile_id = auth.uid() OR public.is_admin());
$$;
REVOKE ALL ON FUNCTION public.get_my_distillery_license(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_distillery_license(uuid) TO authenticated;