-- Manual approval of successful payment transaction
-- Update transaction to approved status since payment was successful
UPDATE transactions 
SET status = 'approved',
    completed_at = now(),
    admin_notes = 'Manually approved - payment succeeded but webhook failed'
WHERE id = 'f2c775e9-c704-437c-b5fb-482c64a0d349' AND status = 'pending';

-- Create cask ownership record for the buyer
INSERT INTO cask_ownership (
    cask_id, 
    owner_id, 
    volume_liters, 
    ownership_percentage, 
    acquisition_price,
    acquired_date
) 
SELECT 
    t.cask_id,
    t.buyer_id,
    t.volume_liters,
    100.0, -- Full ownership
    t.total_amount,
    now()
FROM transactions t 
WHERE t.id = 'f2c775e9-c704-437c-b5fb-482c64a0d349'
ON CONFLICT (cask_id, owner_id) DO NOTHING;