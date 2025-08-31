-- Complete the pending transaction and create ownership for the recent purchase
UPDATE transactions 
SET status = 'completed', 
    completed_at = now()
WHERE id = 'dcfcd033-dfa7-4158-ba64-e09d5fa87c89' 
AND buyer_id = 'fc1421f8-9702-4a0b-9a87-3d401cf1adfd'
AND status = 'pending';

-- Create the cask ownership record for the completed transaction
INSERT INTO cask_ownership (
  cask_id,
  owner_id, 
  volume_liters,
  ownership_percentage,
  acquisition_price,
  acquired_date
) 
SELECT 
  cask_id,
  buyer_id,
  volume_liters,
  100.0,
  total_amount,
  now()
FROM transactions 
WHERE id = 'dcfcd033-dfa7-4158-ba64-e09d5fa87c89'
AND NOT EXISTS (
  SELECT 1 FROM cask_ownership 
  WHERE cask_id = transactions.cask_id 
  AND owner_id = transactions.buyer_id
);