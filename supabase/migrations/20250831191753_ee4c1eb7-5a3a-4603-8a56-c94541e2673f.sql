-- Test if we can directly create a simple query that bypasses RLS for debugging
-- This is a temporary debug query
SELECT 
  co.id,
  co.owner_id, 
  co.volume_liters,
  co.is_active,
  c.spirit_name,
  c.cask_number
FROM cask_ownership co
JOIN casks c ON co.cask_id = c.id 
WHERE co.owner_id = 'fc1421f8-9702-4a0b-9a87-3d401cf1adfd'
AND co.is_active = true;