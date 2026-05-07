DELETE FROM public.distilleries
WHERE id IN (
  'f2cd21db-df93-4b60-9b43-b0c710944b92',
  'd31a7539-522b-4cf1-abe7-7ef54eb49b94',
  '09eefb82-1874-4647-a77a-e517bd495516'
);

GRANT SELECT, INSERT, UPDATE ON public.distilleries TO authenticated;
GRANT SELECT ON public.distilleries TO anon;

CREATE UNIQUE INDEX IF NOT EXISTS distilleries_profile_id_unique
  ON public.distilleries (profile_id);