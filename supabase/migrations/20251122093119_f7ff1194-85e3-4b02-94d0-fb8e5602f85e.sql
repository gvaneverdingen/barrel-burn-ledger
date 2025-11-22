-- Fix the buggy RLS policy on cask_ownership that prevents viewing active sales
DROP POLICY IF EXISTS "Active sales are viewable" ON public.cask_ownership;

-- The existing "Active sales are viewable for purchasing" policy is correct, so we keep it

-- Add a policy to casks table to allow viewing casks that are part of active resales
-- This is needed because when a cask is purchased, it may be marked as available_for_sale = false
-- But when it's listed for resale, it should still be viewable
CREATE POLICY "Casks in active resales are viewable"
ON public.casks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM cask_sales cs
    JOIN cask_ownership co ON co.id = cs.ownership_id
    WHERE co.cask_id = casks.id 
    AND cs.status = 'active'
  )
);