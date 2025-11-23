-- Complete the resale transaction that was interrupted by the webhook bug
-- Transaction ID: ff057fdd-9837-441d-b733-11119e5a2374
-- Sale ID: f2e0ed87-2579-4548-b6fd-80537334313c
-- Buyer ID: 67bfa366-c5ab-4ef4-b777-a966a95c092c
-- Seller ID: ef0e9886-bd40-4403-99ea-f62ebb3a995c
-- Cask ID: 2bce9285-7b89-4f7c-a18e-cb614f04f6c9

-- 1. Update sale status to 'sold'
UPDATE public.cask_sales
SET status = 'sold', updated_at = now()
WHERE id = 'f2e0ed87-2579-4548-b6fd-80537334313c';

-- 2. Deactivate previous ownership (seller)
UPDATE public.cask_ownership
SET is_active = false, updated_at = now()
WHERE id = 'c6255494-1a5e-40b4-be23-28b4ad37d00a';

-- 3. Create new ownership for buyer
INSERT INTO public.cask_ownership (
  cask_id,
  owner_id,
  volume_liters,
  ownership_percentage,
  acquisition_price,
  acquired_date,
  is_active
)
VALUES (
  '2bce9285-7b89-4f7c-a18e-cb614f04f6c9',
  '67bfa366-c5ab-4ef4-b777-a966a95c092c',
  190,
  100.0,
  237500,
  now(),
  true
);