ALTER TABLE public.cask_sales ADD COLUMN IF NOT EXISTS contact_email text, ADD COLUMN IF NOT EXISTS contact_phone text, ADD COLUMN IF NOT EXISTS sold_to uuid, ADD COLUMN IF NOT EXISTS sold_at timestamptz;
GRANT SELECT (contact_email, contact_phone, sold_at) ON public.cask_sales TO authenticated;
GRANT INSERT (contact_email, contact_phone), UPDATE (contact_email, contact_phone) ON public.cask_sales TO authenticated;
GRANT ALL ON public.cask_sales TO service_role;

CREATE OR REPLACE FUNCTION public.confirm_resale_sold(_sale_id uuid, _buyer_email text, _final_price numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; _buyer uuid; _own record;
BEGIN
  IF _final_price IS NULL OR _final_price <= 0 THEN RAISE EXCEPTION 'Enter the final sale price'; END IF;
  SELECT * INTO s FROM cask_sales WHERE id=_sale_id FOR UPDATE;
  IF s IS NULL OR s.seller_id <> auth.uid() THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF s.status <> 'active' THEN RAISE EXCEPTION 'This listing is no longer active'; END IF;
  SELECT id INTO _buyer FROM profiles WHERE lower(email)=lower(trim(_buyer_email));
  IF _buyer IS NULL THEN RAISE EXCEPTION 'The buyer must have an ARIGI account with this email'; END IF;
  IF _buyer = auth.uid() THEN RAISE EXCEPTION 'You cannot sell to yourself'; END IF;
  SELECT * INTO _own FROM cask_ownership WHERE cask_id=s.cask_id AND owner_id=auth.uid() AND is_active LIMIT 1;
  IF _own IS NULL THEN RAISE EXCEPTION 'You no longer own this cask'; END IF;

  UPDATE cask_ownership SET is_active=false WHERE id=_own.id;
  INSERT INTO cask_ownership (cask_id, owner_id, volume_liters, ownership_percentage, acquired_date, acquisition_price, is_active)
  VALUES (s.cask_id, _buyer, _own.volume_liters, _own.ownership_percentage, now(), _final_price, true);
  UPDATE cask_sales SET status='sold', sold_to=_buyer, sold_at=now() WHERE id=_sale_id;
  INSERT INTO transactions (cask_id, buyer_id, seller_id, transaction_type, volume_liters, price_per_liter, total_amount, transaction_fee, distillery_fee, platform_fee, status, completed_at, sale_listing_id, admin_notes)
  VALUES (s.cask_id, _buyer, auth.uid(), 'resale', _own.volume_liters, round(_final_price/nullif(_own.volume_liters,0),2), _final_price, 0, 0, 0, 'completed', now(), _sale_id, 'Resale confirmed by seller (settled directly with buyer)');
  INSERT INTO notifications (user_id, type, title, message, link) VALUES
    (_buyer, 'purchase', 'Cask transferred to you', 'A cask resale was confirmed and is now in your portfolio.', '/cask/' || s.cask_id),
    (auth.uid(), 'sale', 'Resale confirmed', 'Your cask has been marked as sold and transferred to the buyer.', '/cask/' || s.cask_id);
END $$;
REVOKE EXECUTE ON FUNCTION public.confirm_resale_sold(uuid,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_resale_sold(uuid,text,numeric) TO authenticated;