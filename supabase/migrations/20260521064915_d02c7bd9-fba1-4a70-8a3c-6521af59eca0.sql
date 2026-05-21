ALTER TABLE public.cask_regauges
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_filename text,
  ADD COLUMN IF NOT EXISTS document_type text;

ALTER TABLE public.cask_transfers
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_filename text,
  ADD COLUMN IF NOT EXISTS document_type text;