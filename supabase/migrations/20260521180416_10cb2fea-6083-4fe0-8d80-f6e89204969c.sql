
-- 1. blockchain_logs
DROP POLICY IF EXISTS "Authenticated users can view blockchain logs" ON public.blockchain_logs;
CREATE POLICY "Involved parties can view blockchain logs"
  ON public.blockchain_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (cask_id IS NOT NULL AND public.can_view_cask(cask_id))
  );

-- 2. cask_ownership: denormalize cask_id onto cask_sales, drop leaky policy
ALTER TABLE public.cask_sales
  ADD COLUMN IF NOT EXISTS cask_id uuid REFERENCES public.casks(id) ON DELETE CASCADE;

UPDATE public.cask_sales cs
SET cask_id = co.cask_id
FROM public.cask_ownership co
WHERE cs.ownership_id = co.id
  AND cs.cask_id IS NULL;

CREATE OR REPLACE FUNCTION public.cask_sales_set_cask_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cask_id IS NULL AND NEW.ownership_id IS NOT NULL THEN
    SELECT co.cask_id INTO NEW.cask_id
    FROM public.cask_ownership co
    WHERE co.id = NEW.ownership_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cask_sales_set_cask_id ON public.cask_sales;
CREATE TRIGGER trg_cask_sales_set_cask_id
  BEFORE INSERT OR UPDATE OF ownership_id ON public.cask_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.cask_sales_set_cask_id();

DROP POLICY IF EXISTS "Active sales are viewable to authenticated buyers" ON public.cask_ownership;

-- 3. distilleries: column-level grants exclude stripe_account_id, stripe_onboarding_complete
REVOKE SELECT ON public.distilleries FROM anon, authenticated;
GRANT SELECT (
  id, name, location, description, website, logo_url,
  established_year, verified, created_at, updated_at, profile_id
) ON public.distilleries TO anon, authenticated;

-- 4. warehouses: drop broad SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view verified warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Anonymous teaser can view verified warehouses" ON public.warehouses;

CREATE OR REPLACE VIEW public.warehouses_public
WITH (security_invoker = true)
AS
SELECT
  id, name, location, country, description,
  verified, created_at, profile_id
FROM public.warehouses
WHERE verified = true;

GRANT SELECT ON public.warehouses_public TO anon, authenticated;

-- 5. transactions: revoke select on sensitive payment IDs
REVOKE SELECT (stripe_payment_intent_id, stripe_transfer_id, admin_notes)
  ON public.transactions FROM anon, authenticated;
