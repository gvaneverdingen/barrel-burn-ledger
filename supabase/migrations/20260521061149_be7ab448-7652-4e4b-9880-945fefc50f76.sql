-- Enums for new structured cask fields
CREATE TYPE public.spirit_type AS ENUM (
  'single_malt','single_grain','blended_malt','blended_grain','blended_whisky',
  'bourbon','rye','corn_whiskey','tennessee_whiskey','irish_pot_still',
  'rum','cognac','armagnac','brandy','tequila','mezcal','other'
);

CREATE TYPE public.wood_species AS ENUM (
  'american_oak','european_oak','spanish_oak','french_oak','hungarian_oak',
  'japanese_mizunara','chestnut','cherry','other'
);

CREATE TYPE public.cask_fill_generation AS ENUM (
  'first_fill','refill','second_fill','third_fill','fourth_fill_plus','rejuvenated','virgin'
);

CREATE TYPE public.previous_contents AS ENUM (
  'virgin_oak','ex_bourbon','ex_sherry_oloroso','ex_sherry_px','ex_sherry_fino',
  'ex_sherry_amontillado','ex_sherry_manzanilla','ex_sherry_palo_cortado',
  'ex_port_ruby','ex_port_tawny','ex_port_white',
  'ex_wine_sauternes','ex_wine_bordeaux','ex_wine_burgundy','ex_wine_tokaji','ex_wine_other',
  'ex_rum','ex_cognac','ex_madeira','ex_marsala','str','other'
);

CREATE TYPE public.toast_level AS ENUM ('light','medium','medium_plus','heavy');

CREATE TYPE public.duty_status AS ENUM ('under_bond','duty_paid');

-- Extend casks
ALTER TABLE public.casks
  ADD COLUMN dsp_code text,
  ADD COLUMN spirit_type public.spirit_type,
  ADD COLUMN wood_species public.wood_species,
  ADD COLUMN char_level smallint CHECK (char_level BETWEEN 1 AND 4),
  ADD COLUMN toast_level public.toast_level,
  ADD COLUMN cooperage text,
  ADD COLUMN cask_fill_generation public.cask_fill_generation,
  ADD COLUMN previous_contents public.previous_contents,
  ADD COLUMN original_lpa numeric,
  ADD COLUMN duty_status public.duty_status DEFAULT 'under_bond',
  ADD COLUMN wowgr_holder_warehouse_id uuid REFERENCES public.warehouses(id),
  ADD COLUMN insurance_valuation numeric,
  ADD COLUMN insurance_valuation_at timestamptz,
  ADD COLUMN provenance_doc_hash text;

-- Regauge history
CREATE TABLE public.cask_regauges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cask_id uuid NOT NULL REFERENCES public.casks(id) ON DELETE CASCADE,
  regauge_date date NOT NULL,
  rla_liters numeric NOT NULL CHECK (rla_liters >= 0),
  bulk_liters numeric NOT NULL CHECK (bulk_liters >= 0),
  abv numeric NOT NULL CHECK (abv > 0 AND abv <= 100),
  measured_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cask_regauges_cask_date ON public.cask_regauges(cask_id, regauge_date DESC);
ALTER TABLE public.cask_regauges ENABLE ROW LEVEL SECURITY;

-- Transfer / vat / warehouse-move history
CREATE TYPE public.cask_transfer_type AS ENUM (
  're_rack','marrying','finishing_transfer','warehouse_move','other'
);

CREATE TABLE public.cask_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cask_id uuid NOT NULL REFERENCES public.casks(id) ON DELETE CASCADE,
  transfer_date date NOT NULL,
  transfer_type public.cask_transfer_type NOT NULL,
  from_cask_id uuid REFERENCES public.casks(id),
  to_cask_id uuid REFERENCES public.casks(id),
  from_warehouse_id uuid REFERENCES public.warehouses(id),
  to_warehouse_id uuid REFERENCES public.warehouses(id),
  reason text,
  doc_hash text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cask_transfers_cask_date ON public.cask_transfers(cask_id, transfer_date DESC);
ALTER TABLE public.cask_transfers ENABLE ROW LEVEL SECURITY;

-- Helper: can the current user manage this cask (distillery owner, warehouse owner, current owner, or admin)?
CREATE OR REPLACE FUNCTION public.can_manage_cask(_cask_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.casks c
               JOIN public.distilleries d ON d.id = c.distillery_id
               WHERE c.id = _cask_id AND d.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.casks c
               JOIN public.warehouses w ON w.id = c.warehouse_id
               WHERE c.id = _cask_id AND w.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.cask_ownership co
               WHERE co.cask_id = _cask_id AND co.owner_id = auth.uid() AND co.is_active = true);
$$;

-- Helper: can the current user view this cask (manage rights OR cask is publicly available for sale)
CREATE OR REPLACE FUNCTION public.can_view_cask(_cask_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.can_manage_cask(_cask_id)
    OR EXISTS (SELECT 1 FROM public.casks c
               WHERE c.id = _cask_id AND c.available_for_sale = true);
$$;

-- RLS: cask_regauges
CREATE POLICY "View regauges for accessible casks"
  ON public.cask_regauges FOR SELECT
  USING (public.can_view_cask(cask_id));

CREATE POLICY "Manage regauges for owned casks"
  ON public.cask_regauges FOR ALL
  USING (public.can_manage_cask(cask_id))
  WITH CHECK (public.can_manage_cask(cask_id));

-- RLS: cask_transfers
CREATE POLICY "View transfers for accessible casks"
  ON public.cask_transfers FOR SELECT
  USING (public.can_view_cask(cask_id));

CREATE POLICY "Manage transfers for owned casks"
  ON public.cask_transfers FOR ALL
  USING (public.can_manage_cask(cask_id))
  WITH CHECK (public.can_manage_cask(cask_id));

-- Timestamp triggers
CREATE TRIGGER trg_cask_regauges_updated_at
  BEFORE UPDATE ON public.cask_regauges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_cask_transfers_updated_at
  BEFORE UPDATE ON public.cask_transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();