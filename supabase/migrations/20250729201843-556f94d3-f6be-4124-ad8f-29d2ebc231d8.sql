-- Add some sample finishing data to make the feature more realistic
UPDATE public.casks 
SET 
  finishing_cask_type = CASE 
    WHEN random() < 0.3 THEN 'Sherry Butt'
    WHEN random() < 0.5 THEN 'Port Wine Cask'
    WHEN random() < 0.7 THEN 'Madeira Cask'
    ELSE NULL
  END,
  finishing_duration_months = CASE 
    WHEN random() < 0.4 THEN 6 + floor(random() * 18)::int -- 6-24 months
    ELSE NULL
  END,
  has_been_finished = CASE 
    WHEN random() < 0.4 THEN TRUE
    ELSE FALSE
  END
WHERE id IN (SELECT id FROM public.casks ORDER BY random() LIMIT 12);

-- Update finishing notes for finished casks
UPDATE public.casks 
SET finishing_notes = CASE finishing_cask_type
  WHEN 'Sherry Butt' THEN 'Additional maturation in ex-Oloroso sherry butts adds rich dried fruit and nutty complexity'
  WHEN 'Port Wine Cask' THEN 'Port wine cask finishing imparts deep berry flavors and wine-like characteristics'
  WHEN 'Madeira Cask' THEN 'Madeira cask finishing contributes honeyed sweetness and tropical fruit notes'
  ELSE NULL
END
WHERE has_been_finished = TRUE AND finishing_notes IS NULL;