
-- 1) Restrict acquisition_price exposure: require authentication to view active-sale ownership rows
DROP POLICY IF EXISTS "Active sales are viewable for purchasing" ON public.cask_ownership;

CREATE POLICY "Active sales are viewable to authenticated buyers"
ON public.cask_ownership
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.cask_sales cs
    WHERE cs.ownership_id = cask_ownership.id
      AND cs.status = 'active'
  )
);

-- 2) Prevent enumeration/listing of the public cask-images bucket.
-- Public direct-URL reads do not go through RLS and continue to work.
DROP POLICY IF EXISTS "Anyone can view cask images" ON storage.objects;
