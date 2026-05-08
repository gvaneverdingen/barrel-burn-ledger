
WITH priced AS (
  SELECT
    c.id,
    c.current_volume_liters AS vol,
    c.alcohol_percentage AS abv,
    (c.current_volume_liters * c.alcohol_percentage / 100.0) AS lpa,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.distillation_date))::int AS age_years,
    ct.name AS cask_type_name,
    c.region
  FROM public.casks c
  LEFT JOIN public.cask_types ct ON ct.id = c.cask_type_id
  WHERE c.available_for_sale = true
),
calc AS (
  SELECT
    id, vol, abv, lpa, age_years,
    -- Base price per LPA by age (USD)
    CASE
      WHEN age_years < 5 THEN 60
      WHEN age_years < 10 THEN 60 + (age_years - 5) * 8        -- 60 -> 100
      WHEN age_years < 12 THEN 100 + (age_years - 10) * 20     -- 100 -> 140
      WHEN age_years < 15 THEN 140 + (age_years - 12) * 20     -- 140 -> 200
      WHEN age_years < 18 THEN 200 + (age_years - 15) * 40     -- 200 -> 320
      WHEN age_years < 21 THEN 320 + (age_years - 18) * 70     -- 320 -> 530
      WHEN age_years < 25 THEN 530 + (age_years - 21) * 90     -- 530 -> 890
      WHEN age_years < 30 THEN 890 + (age_years - 25) * 120    -- 890 -> 1490
      ELSE 1490 + (age_years - 30) * 150
    END::numeric AS base_per_lpa,
    -- Cask type multiplier
    CASE
      WHEN cask_type_name ILIKE '%sherry%butt%'    THEN 1.25
      WHEN cask_type_name ILIKE '%sherry%hogshead%' THEN 1.25
      WHEN cask_type_name ILIKE '%sherry%'          THEN 1.20
      WHEN cask_type_name ILIKE '%mizunara%'        THEN 1.50
      WHEN cask_type_name ILIKE '%madeira%'         THEN 1.20
      WHEN cask_type_name ILIKE '%port%'            THEN 1.20
      WHEN cask_type_name ILIKE '%cognac%'          THEN 1.20
      WHEN cask_type_name ILIKE '%virgin%oak%'      THEN 1.05
      WHEN cask_type_name ILIKE '%quarter%'         THEN 0.95
      WHEN cask_type_name ILIKE '%bourbon%'         THEN 1.00
      ELSE 1.00
    END::numeric AS type_mult,
    -- Region multiplier
    CASE
      WHEN region ILIKE '%islay%'        THEN 1.25
      WHEN region ILIKE '%campbeltown%'  THEN 1.15
      WHEN region ILIKE '%speyside%'     THEN 1.10
      WHEN region ILIKE '%highland%'     THEN 1.00
      WHEN region ILIKE '%lowland%'      THEN 0.90
      ELSE 1.00
    END::numeric AS region_mult
  FROM priced
),
final AS (
  SELECT
    id,
    vol,
    ROUND((base_per_lpa * type_mult * region_mult * lpa)::numeric, -2) AS new_total
  FROM calc
  WHERE vol IS NOT NULL AND abv IS NOT NULL AND lpa > 0
)
UPDATE public.casks c
SET
  total_price     = f.new_total,
  price_per_liter = ROUND((f.new_total / f.vol)::numeric, 2),
  updated_at      = now()
FROM final f
WHERE c.id = f.id;
