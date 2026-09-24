ALTER TABLE public.distilleries ADD COLUMN IF NOT EXISTS wallet_address text;
CREATE OR REPLACE FUNCTION public.validate_distillery_wallet() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.wallet_address IS NOT NULL AND NEW.wallet_address !~ '^0x[0-9a-fA-F]{40}$' THEN
    RAISE EXCEPTION 'Wallet address must be a 0x… Polygon address (42 characters)';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_distillery_wallet BEFORE INSERT OR UPDATE OF wallet_address ON public.distilleries
FOR EACH ROW EXECUTE FUNCTION public.validate_distillery_wallet();
GRANT SELECT (wallet_address) ON public.distilleries TO anon, authenticated;
GRANT UPDATE (wallet_address) ON public.distilleries TO authenticated;