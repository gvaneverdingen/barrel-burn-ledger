-- Manual fix: Update transaction status to simulate successful webhook
UPDATE transactions 
SET status = 'payment_received_awaiting_approval',
    completed_at = now()
WHERE id = 'f2c775e9-c704-437c-b5fb-482c64a0d349' AND status = 'pending';