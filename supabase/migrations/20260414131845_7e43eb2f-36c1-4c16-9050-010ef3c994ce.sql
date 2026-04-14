-- Seed fee structure with correct fee_type values
INSERT INTO public.fee_structure (fee_type, percentage, fixed_amount, description, is_active) VALUES
  ('platform', 2.5, NULL, 'Platform service fee charged on all transactions', true),
  ('transaction', 1.5, NULL, 'Payment processing and transaction handling fee', true),
  ('distillery', 5.0, NULL, 'Commission paid to the originating distillery on secondary sales', true),
  ('storage', NULL, 250.00, 'Annual cask storage and insurance fee (per cask)', true);

-- Fill region based on distillery name
UPDATE public.casks SET region = 'Speyside'
WHERE distillery_id IN (SELECT id FROM distilleries WHERE name ILIKE '%speyside%')
  AND (region IS NULL OR region = '');

UPDATE public.casks SET region = 'Highlands'
WHERE distillery_id IN (SELECT id FROM distilleries WHERE name ILIKE '%highland%')
  AND (region IS NULL OR region = '');

UPDATE public.casks SET region = 'Scotland'
WHERE region IS NULL OR region = '';

-- Fill age_years from spirit_name
UPDATE public.casks SET age_years = CAST(
  (regexp_match(spirit_name, '(\d+)\s*[Yy]ear'))[1] AS integer
)
WHERE age_years IS NULL
  AND spirit_name ~ '\d+\s*[Yy]ear';

-- Fill quality_grade based on age
UPDATE public.casks SET quality_grade = CASE
  WHEN age_years >= 21 THEN 'Exceptional'
  WHEN age_years >= 18 THEN 'Premium'
  WHEN age_years >= 15 THEN 'Superior'
  WHEN age_years >= 12 THEN 'Fine'
  ELSE 'Standard'
END
WHERE quality_grade IS NULL AND age_years IS NOT NULL;
