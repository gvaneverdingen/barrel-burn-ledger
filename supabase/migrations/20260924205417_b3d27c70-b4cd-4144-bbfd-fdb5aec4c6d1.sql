CREATE OR REPLACE FUNCTION public.get_cask_provenance(_cask_id uuid)
RETURNS TABLE (event_at timestamptz, event_type text, title text, detail text, amount numeric, owner_label text, tx_hash text, on_chain boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH ok AS (SELECT public.can_view_cask(_cask_id) OR EXISTS (SELECT 1 FROM transactions t WHERE t.cask_id=_cask_id AND t.status='completed') AS v),
  sales AS (
    SELECT t.completed_at AS at, t.transaction_type, t.total_amount, t.buyer_id, t.blockchain_transaction_hash AS h,
           dense_rank() OVER (ORDER BY first_at) AS owner_no
    FROM transactions t
    JOIN (SELECT buyer_id b, min(completed_at) first_at FROM transactions WHERE cask_id=_cask_id AND status='completed' GROUP BY buyer_id) f ON f.b=t.buyer_id
    WHERE t.cask_id=_cask_id AND t.status='completed'
  )
  SELECT * FROM (
    SELECT c.distillation_date::timestamptz, 'origin', 'Filled at distillery',
           coalesce(d.name,'Distillery') || coalesce(' · cask #' || c.cask_number,''), NULL::numeric, coalesce(d.name,'Distillery'), NULL::text, false
    FROM casks c LEFT JOIN distilleries d ON d.id=c.distillery_id WHERE c.id=_cask_id
    UNION ALL
    SELECT c.nft_minted_at, 'mint', 'Recorded on blockchain', 'Digital ownership certificate #' || c.nft_token_id,
           NULL, NULL, (SELECT bl.blockchain_hash FROM blockchain_logs bl WHERE bl.cask_id=_cask_id AND bl.transaction_type ILIKE '%mint%' ORDER BY bl.created_at LIMIT 1), true
    FROM casks c WHERE c.id=_cask_id AND c.nft_minted_at IS NOT NULL
    UNION ALL
    SELECT s.at, CASE WHEN s.transaction_type ILIKE '%resale%' OR s.transaction_type ILIKE '%secondary%' THEN 'resale' ELSE 'sale' END,
           CASE WHEN s.transaction_type ILIKE '%resale%' OR s.transaction_type ILIKE '%secondary%' THEN 'Resold' ELSE 'First sale' END,
           'Ownership passed to Owner ' || s.owner_no, s.total_amount, 'Owner ' || s.owner_no,
           CASE WHEN s.h ~ '^0x[0-9a-fA-F]{64}$' THEN s.h END, s.h ~ '^0x[0-9a-fA-F]{64}$'
    FROM sales s
    UNION ALL
    SELECT ct.transfer_date::timestamptz, 'transfer', initcap(replace(ct.transfer_type::text,'_',' ')),
           coalesce(fw.name,'') || CASE WHEN fw.name IS NOT NULL AND tw.name IS NOT NULL THEN ' → ' ELSE '' END || coalesce(tw.name,'') ||
           coalesce(CASE WHEN fw.name IS NULL AND tw.name IS NULL THEN ct.reason END,''),
           NULL, NULL, ct.doc_hash, false
    FROM cask_transfers ct LEFT JOIN warehouses fw ON fw.id=ct.from_warehouse_id LEFT JOIN warehouses tw ON tw.id=ct.to_warehouse_id
    WHERE ct.cask_id=_cask_id OR ct.from_cask_id=_cask_id OR ct.to_cask_id=_cask_id
  ) e(event_at, event_type, title, detail, amount, owner_label, tx_hash, on_chain)
  WHERE (SELECT v FROM ok) AND event_at IS NOT NULL
  ORDER BY event_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.get_cask_provenance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cask_provenance(uuid) TO anon, authenticated;