
-- Drop the overly permissive public SELECT and replace with authenticated-only
DROP POLICY IF EXISTS "Anyone can view available casks" ON public.casks;

CREATE POLICY "Authenticated users can view available casks"
ON public.casks
FOR SELECT
TO authenticated
USING (available_for_sale = true);

-- Create a safe public view for unauthenticated marketplace browsing (no pricing)
CREATE OR REPLACE VIEW public.casks_marketplace AS
SELECT
  c.id,
  c.spirit_name,
  c.cask_number,
  c.region,
  c.age_years,
  c.distillation_date,
  c.quality_grade,
  c.rarity_tier,
  c.is_single_barrel,
  c.special_finish,
  c.tasting_notes,
  c.has_been_finished,
  c.finishing_cask_type,
  c.finishing_duration_months,
  c.warehouse_location,
  c.distillery_id,
  c.cask_type_id,
  c.available_for_sale,
  c.expected_maturation_years,
  ct.name AS cask_type_name,
  ct.capacity_liters AS cask_type_capacity
FROM public.casks c
LEFT JOIN public.cask_types ct ON c.cask_type_id = ct.id
WHERE c.available_for_sale = true;
