ALTER TABLE public.cask_sales
  ADD COLUMN IF NOT EXISTS seller_wallet text,
  ADD COLUMN IF NOT EXISTS reserved_for uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reserved_price numeric;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_blockchain_hash_unique
  ON public.transactions (lower(blockchain_transaction_hash)) WHERE blockchain_transaction_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.request_resale_crypto_payment(_sale_id uuid, _buyer_email text, _price numeric, _wallet text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s record; _buyer uuid;
BEGIN
  IF _price IS NULL OR _price <= 0 THEN RAISE EXCEPTION 'Enter the agreed price'; END IF;
  IF _wallet IS NULL OR _wallet !~ '^0x[0-9a-fA-F]{40}$' THEN RAISE EXCEPTION 'Enter a valid Polygon wallet address (0x…, 42 characters)'; END IF;
  SELECT * INTO s FROM cask_sales WHERE id=_sale_id FOR UPDATE;
  IF s IS NULL OR s.seller_id <> auth.uid() THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF s.status <> 'active' THEN RAISE EXCEPTION 'This listing is no longer active'; END IF;
  SELECT id INTO _buyer FROM profiles WHERE lower(email)=lower(trim(_buyer_email));
  IF _buyer IS NULL THEN RAISE EXCEPTION 'The buyer must have an ARIGI account with this email'; END IF;
  IF _buyer = auth.uid() THEN RAISE EXCEPTION 'You cannot sell to yourself'; END IF;
  UPDATE cask_sales SET seller_wallet=_wallet, reserved_for=_buyer, reserved_price=_price WHERE id=_sale_id;
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (_buyer, 'purchase', 'A cask is waiting for your payment',
          'A seller has sent you a USDC payment request for a cask. Open Resell a Cask to pay from your wallet.', '/sell');
END $$;
REVOKE ALL ON FUNCTION public.request_resale_crypto_payment(uuid,text,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_resale_crypto_payment(uuid,text,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_resale_payment_requests()
RETURNS TABLE(sale_id uuid, cask_id uuid, spirit_name text, cask_number text, price numeric, seller_wallet text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT s.id, c.id, c.spirit_name, c.cask_number, s.reserved_price, s.seller_wallet
  FROM cask_sales s JOIN casks c ON c.id=s.cask_id
  WHERE s.reserved_for = auth.uid() AND s.status='active' AND s.seller_wallet IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.get_my_resale_payment_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_resale_payment_requests() TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_resale_crypto(_sale_id uuid, _buyer uuid, _tx_hash text, _amount numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s record; _own record; _tid uuid;
BEGIN
  SELECT * INTO s FROM cask_sales WHERE id=_sale_id FOR UPDATE;
  IF s IS NULL OR s.status <> 'active' THEN RAISE EXCEPTION 'This listing is no longer active'; END IF;
  IF s.reserved_for IS DISTINCT FROM _buyer THEN RAISE EXCEPTION 'This payment request is for another buyer'; END IF;
  SELECT * INTO _own FROM cask_ownership WHERE cask_id=s.cask_id AND owner_id=s.seller_id AND is_active LIMIT 1;
  IF _own IS NULL THEN RAISE EXCEPTION 'The seller no longer owns this cask'; END IF;
  UPDATE cask_ownership SET is_active=false WHERE id=_own.id;
  INSERT INTO cask_ownership (cask_id, owner_id, volume_liters, ownership_percentage, acquired_date, acquisition_price, is_active)
  VALUES (s.cask_id, _buyer, _own.volume_liters, _own.ownership_percentage, now(), _amount, true);
  UPDATE cask_sales SET status='sold', sold_to=_buyer, sold_at=now() WHERE id=_sale_id;
  INSERT INTO transactions (cask_id, buyer_id, seller_id, transaction_type, volume_liters, price_per_liter, total_amount, transaction_fee, distillery_fee, platform_fee, status, completed_at, sale_listing_id, blockchain_transaction_hash, admin_notes)
  VALUES (s.cask_id, _buyer, s.seller_id, 'sale', _own.volume_liters, round(_amount/nullif(_own.volume_liters,0),2), _amount, 0, 0, 0, 'completed', now(), _sale_id, _tx_hash, 'Resale paid in USDC directly buyer → seller on Polygon')
  RETURNING id INTO _tid;
  INSERT INTO notifications (user_id, type, title, message, link) VALUES
    (_buyer, 'purchase', 'Cask transferred to you', 'Your USDC payment was confirmed on Polygon and the cask is now in your portfolio.', '/cask/' || s.cask_id),
    (s.seller_id, 'sale', 'USDC payment received', 'The buyer paid you in USDC on Polygon. The cask has been transferred to them.', '/cask/' || s.cask_id);
  RETURN _tid;
END $$;
REVOKE ALL ON FUNCTION public.complete_resale_crypto(uuid,uuid,text,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_resale_crypto(uuid,uuid,text,numeric) TO service_role;