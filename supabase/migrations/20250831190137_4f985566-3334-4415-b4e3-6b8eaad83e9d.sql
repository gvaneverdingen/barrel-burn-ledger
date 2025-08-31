-- Create cask ownership record for successful payment
INSERT INTO cask_ownership (
    cask_id, 
    owner_id, 
    volume_liters, 
    ownership_percentage, 
    acquisition_price,
    acquired_date
) VALUES (
    '61d4257f-6d08-458e-b4d6-f2571454be80',  -- cask_id from transaction
    'fc1421f8-9702-4a0b-9a87-3d401cf1adfd',  -- your user_id
    190.00,  -- volume from transaction
    100.0,   -- full ownership
    76000.00, -- total amount paid
    now()
);