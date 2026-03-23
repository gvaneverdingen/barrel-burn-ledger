ALTER TABLE public.offers DROP COLUMN last_gauging_date;
ALTER TABLE public.cask_sales ADD COLUMN last_gauging_date date NULL;