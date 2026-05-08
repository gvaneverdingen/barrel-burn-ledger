-- 1. Create warehouses table (mirror of distilleries, with bonded-warehouse-specific fields)
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  country TEXT,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  established_year INTEGER,
  -- Bonded warehouse specific
  bonded_warehouse_number TEXT,
  customs_jurisdiction TEXT,
  warehouse_keeper_license TEXT,
  excise_authority TEXT,
  capacity_casks INTEGER,
  -- Verification + payouts
  verified BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX warehouses_profile_id_unique ON public.warehouses(profile_id);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- RLS for warehouses (mirrors distilleries policies)
CREATE POLICY "Admins can manage all warehouses"
  ON public.warehouses FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anonymous teaser can view verified warehouses"
  ON public.warehouses FOR SELECT TO anon
  USING (verified = true);

CREATE POLICY "Authenticated users can view verified warehouses"
  ON public.warehouses FOR SELECT TO authenticated
  USING (verified = true);

CREATE POLICY "Warehouse owners can manage their warehouse"
  ON public.warehouses FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Warehouse owners can view their complete data"
  ON public.warehouses FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create warehouse applications"
  ON public.warehouses FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- updated_at trigger
CREATE TRIGGER set_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Extend casks: allow warehouse-attributed casks
ALTER TABLE public.casks
  ALTER COLUMN distillery_id DROP NOT NULL,
  ADD COLUMN warehouse_id UUID;

ALTER TABLE public.casks
  ADD CONSTRAINT casks_holder_check
  CHECK (
    (distillery_id IS NOT NULL AND warehouse_id IS NULL)
    OR (distillery_id IS NULL AND warehouse_id IS NOT NULL)
  );

CREATE INDEX idx_casks_warehouse_id ON public.casks(warehouse_id);

-- 3. RLS: warehouses can manage their own casks (mirror distillery policy)
CREATE POLICY "Warehouses can manage their casks"
  ON public.casks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = casks.warehouse_id AND w.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = casks.warehouse_id AND w.profile_id = auth.uid()
    )
  );
