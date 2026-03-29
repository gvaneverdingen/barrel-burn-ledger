-- CRITICAL FIX 1: Privilege escalation - user_roles INSERT
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CRITICAL FIX 2: Notifications INSERT - prevent spam injection
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (false);

-- CRITICAL FIX 3: Blockchain logs INSERT - prevent fake entries
DROP POLICY IF EXISTS "System can insert blockchain logs" ON public.blockchain_logs;
CREATE POLICY "System can insert blockchain logs"
  ON public.blockchain_logs FOR INSERT TO authenticated
  WITH CHECK (false);

-- FIX 4: Payouts INSERT - restrict to service role only
DROP POLICY IF EXISTS "System can create payouts for transactions" ON public.payouts;
CREATE POLICY "System can create payouts for transactions"
  ON public.payouts FOR INSERT TO authenticated
  WITH CHECK (false);

-- FIX 5: Remove anon access to distillery sensitive data
DROP POLICY IF EXISTS "Public can view verified distilleries for joins" ON public.distilleries;

-- FIX 6: Fix mutable search_path on functions
CREATE OR REPLACE FUNCTION public.validate_cask_pricing()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$
BEGIN
  IF NEW.available_for_sale = true THEN
    IF NEW.price_per_liter IS NULL THEN RAISE EXCEPTION 'Casks available for sale must have price_per_liter set'; END IF;
    IF NEW.total_price IS NULL THEN RAISE EXCEPTION 'Casks available for sale must have total_price set'; END IF;
    IF NEW.current_volume_liters IS NULL THEN RAISE EXCEPTION 'Casks available for sale must have current_volume_liters set'; END IF;
    IF NEW.alcohol_percentage IS NULL THEN RAISE EXCEPTION 'Casks available for sale must have alcohol_percentage set'; END IF;
    IF NEW.price_per_liter <= 0 THEN RAISE EXCEPTION 'price_per_liter must be greater than 0'; END IF;
    IF NEW.total_price <= 0 THEN RAISE EXCEPTION 'total_price must be greater than 0'; END IF;
    IF NEW.current_volume_liters <= 0 THEN RAISE EXCEPTION 'current_volume_liters must be greater than 0'; END IF;
    IF NEW.alcohol_percentage <= 0 OR NEW.alcohol_percentage > 100 THEN RAISE EXCEPTION 'alcohol_percentage must be between 0 and 100'; END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;