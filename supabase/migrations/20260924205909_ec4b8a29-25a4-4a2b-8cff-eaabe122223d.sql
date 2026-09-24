DO $$
DECLARE src text;
BEGIN
  SELECT pg_get_functiondef('public.confirm_resale_sold(uuid,text,numeric)'::regprocedure) INTO src;
  EXECUTE replace(src, 'auth.uid(), ''resale'', _own.volume_liters', 'auth.uid(), ''sale'', _own.volume_liters');
  SELECT pg_get_functiondef('public.get_cask_provenance(uuid)'::regprocedure) INTO src;
  src := replace(src, 'SELECT t.completed_at AS at, t.transaction_type,', 'SELECT t.completed_at AS at, CASE WHEN t.sale_listing_id IS NOT NULL THEN ''resale'' ELSE t.transaction_type END AS transaction_type,');
  EXECUTE src;
END $$;