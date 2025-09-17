-- Clear dummy data from all tables in correct order to avoid foreign key constraints

-- Delete payouts first (references transactions)
DELETE FROM public.payouts;

-- Delete transactions (references casks, profiles)
DELETE FROM public.transactions;

-- Delete cask sales (references cask_ownership)
DELETE FROM public.cask_sales;

-- Delete cask ownership (references casks, profiles)  
DELETE FROM public.cask_ownership;

-- Delete cask images (references casks)
DELETE FROM public.cask_images;

-- Delete casks (references distilleries, cask_types)
DELETE FROM public.casks;

-- Delete distilleries (references profiles)
DELETE FROM public.distilleries;

-- Delete wallets (references profiles)
DELETE FROM public.wallets;

-- Delete cask types (independent table)
DELETE FROM public.cask_types;

-- Delete fee structure (independent table)
DELETE FROM public.fee_structure;

-- Note: Not deleting profiles as they contain user authentication data
-- If you want to delete specific test profiles, we can do that separately

-- Reset any sequences if needed
-- This ensures new records start with clean IDs