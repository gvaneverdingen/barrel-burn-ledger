-- 1. transactions: hide Stripe identifiers and admin notes from end users
REVOKE SELECT ON public.transactions FROM authenticated;
REVOKE SELECT ON public.transactions FROM anon;
GRANT SELECT (
  id, cask_id, buyer_id, seller_id, transaction_type, volume_liters,
  price_per_liter, total_amount, transaction_fee, distillery_fee, platform_fee,
  blockchain_transaction_hash, status, completed_at, created_at, seller_amount,
  sale_listing_id
) ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

-- 2. cask_sales: hide internal ownership linkage from marketplace browsers
REVOKE SELECT ON public.cask_sales FROM authenticated;
REVOKE SELECT ON public.cask_sales FROM anon;
GRANT SELECT (
  id, seller_id, asking_price_per_liter, total_asking_price,
  volume_for_sale_liters, listing_date, expires_at, status, notes,
  created_at, updated_at, last_gauging_date, cask_id
) ON public.cask_sales TO authenticated;
GRANT ALL ON public.cask_sales TO service_role;

-- 3. warehouses: no anonymous access to regulatory / Stripe data (public view exists)
REVOKE ALL ON public.warehouses FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;

-- 4. blockchain_logs: only transaction parties (cask managers) or admins
DROP POLICY IF EXISTS "Involved parties can view blockchain logs" ON public.blockchain_logs;
CREATE POLICY "Involved parties can view blockchain logs"
ON public.blockchain_logs
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR (cask_id IS NOT NULL AND public.can_manage_cask(cask_id))
  OR (transaction_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.id = blockchain_logs.transaction_id
          AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
      ))
);