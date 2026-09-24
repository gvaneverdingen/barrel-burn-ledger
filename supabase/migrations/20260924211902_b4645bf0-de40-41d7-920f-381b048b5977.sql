CREATE OR REPLACE FUNCTION public.list_verified_warehouses()
RETURNS TABLE(id uuid, name text, location text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT w.id, w.name, w.location FROM warehouses w WHERE w.verified = true ORDER BY w.name $$;
REVOKE ALL ON FUNCTION public.list_verified_warehouses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_verified_warehouses() TO authenticated;