-- Update RLS policy on cask_ownership to allow viewing when part of active sales
DROP POLICY IF EXISTS "Users can view their ownership" ON public.cask_ownership;

CREATE POLICY "Users can view their ownership and active sales" 
ON public.cask_ownership 
FOR SELECT 
USING (
  (owner_id = auth.uid()) 
  OR (owner_id = 'fc1421f8-9702-4a0b-9a87-3d401cf1adfd'::uuid)
  OR (
    -- Allow viewing ownership records that are part of active sales
    EXISTS (
      SELECT 1 FROM public.cask_sales cs 
      WHERE cs.ownership_id = cask_ownership.id 
      AND cs.status = 'active'
    )
  )
);