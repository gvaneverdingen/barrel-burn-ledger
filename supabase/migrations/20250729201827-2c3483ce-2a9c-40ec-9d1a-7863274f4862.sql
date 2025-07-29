-- Add fields for cask finishing and changes during aging
ALTER TABLE public.casks 
ADD COLUMN original_cask_type TEXT,
ADD COLUMN finishing_cask_type TEXT,
ADD COLUMN finishing_duration_months INTEGER,
ADD COLUMN finishing_notes TEXT,
ADD COLUMN has_been_finished BOOLEAN DEFAULT FALSE;

-- Update existing casks to set original_cask_type based on current data
UPDATE public.casks 
SET original_cask_type = (
  SELECT name FROM public.cask_types 
  WHERE id = casks.cask_type_id
),
has_been_finished = FALSE
WHERE original_cask_type IS NULL;