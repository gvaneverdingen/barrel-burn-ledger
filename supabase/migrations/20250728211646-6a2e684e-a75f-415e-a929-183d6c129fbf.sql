-- Insert test cask types (different wood types)
INSERT INTO public.cask_types (name, capacity_liters, description) VALUES
('American Oak Bourbon Barrel', 200, 'Previously used bourbon barrels with rich vanilla and caramel notes'),
('European Oak Sherry Butt', 500, 'Large sherry casks imparting dried fruit and nutty flavors'),
('French Oak Cognac Barrel', 225, 'Ex-cognac barrels adding elegant spice and dried fruit character'),
('Port Wine Cask', 250, 'Sweet port wine casks contributing rich berry and chocolate notes'),
('Madeira Wine Cask', 420, 'Madeira wine casks offering tropical fruit and honey characteristics'),
('Virgin American Oak', 200, 'New American oak providing intense vanilla and coconut flavors'),
('European Oak Hogshead', 250, 'Traditional hogsheads allowing spirit character to develop'),
('Japanese Mizunara Oak', 180, 'Rare Japanese oak with distinctive incense and sandalwood notes')
ON CONFLICT DO NOTHING;

-- Insert test user profiles (these will be our test users)
INSERT INTO public.profiles (id, email, role, first_name, last_name, company_name, verification_status) VALUES
-- Distillery users
('11111111-1111-1111-1111-111111111111', 'highlands@distillery.com', 'distillery', 'Robert', 'MacLeod', 'Highland Spirits Distillery', 'verified'),
('22222222-2222-2222-2222-222222222222', 'speyside@distillery.com', 'distillery', 'Margaret', 'Campbell', 'Speyside Premium Whisky Co.', 'verified'),
('33333333-3333-3333-3333-333333333333', 'islay@distillery.com', 'distillery', 'Ian', 'Morrison', 'Islay Smoke & Fire Distillery', 'verified'),

-- Consumer/Investor users
('44444444-4444-4444-4444-444444444444', 'james.investor@email.com', 'consumer', 'James', 'Wellington', NULL, 'verified'),
('55555555-5555-5555-5555-555555555555', 'sarah.collector@email.com', 'consumer', 'Sarah', 'Thompson', 'Thompson Investment Group', 'verified'),
('66666666-6666-6666-6666-666666666666', 'michael.trader@email.com', 'investor', 'Michael', 'Chen', NULL, 'verified'),
('77777777-7777-7777-7777-777777777777', 'emma.funds@email.com', 'investor', 'Emma', 'Rodriguez', 'Premium Spirits Fund', 'verified'),
('88888888-8888-8888-8888-888888888888', 'david.private@email.com', 'consumer', 'David', 'Smith', NULL, 'verified')
ON CONFLICT DO NOTHING;

-- Insert test distilleries
INSERT INTO public.distilleries (id, profile_id, name, location, description, license_number, established_year, verified, website) VALUES
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Highland Spirits Distillery', 'Speyside, Scotland', 'Traditional Highland single malt distillery established in 1887, known for producing exceptional whisky using time-honored methods and the finest local ingredients.', 'SCT-HSV-1887', 1887, true, 'https://highland-spirits.co.uk'),
('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Speyside Premium Whisky Co.', 'Speyside, Scotland', 'Award-winning distillery specializing in premium aged whiskies with complex flavor profiles, winner of multiple international spirits competitions.', 'SCT-SPW-1923', 1923, true, 'https://speyside-premium.com'),
('cccc3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Islay Smoke & Fire Distillery', 'Islay, Scotland', 'Bold and peated Islay single malts with intense smokiness and maritime character, crafted on the rugged shores of Scotland''s whisky island.', 'SCT-ISF-1956', 1956, true, 'https://islay-smoke.co.uk')
ON CONFLICT DO NOTHING;

-- Get cask type IDs for our inserts
DO $$
DECLARE
    bourbon_barrel_id uuid;
    sherry_butt_id uuid;
    cognac_barrel_id uuid;
    port_cask_id uuid;
    madeira_cask_id uuid;
    virgin_oak_id uuid;
    hogshead_id uuid;
    mizunara_id uuid;
BEGIN
    -- Get cask type IDs
    SELECT id INTO bourbon_barrel_id FROM public.cask_types WHERE name = 'American Oak Bourbon Barrel';
    SELECT id INTO sherry_butt_id FROM public.cask_types WHERE name = 'European Oak Sherry Butt';
    SELECT id INTO cognac_barrel_id FROM public.cask_types WHERE name = 'French Oak Cognac Barrel';
    SELECT id INTO port_cask_id FROM public.cask_types WHERE name = 'Port Wine Cask';
    SELECT id INTO madeira_cask_id FROM public.cask_types WHERE name = 'Madeira Wine Cask';
    SELECT id INTO virgin_oak_id FROM public.cask_types WHERE name = 'Virgin American Oak';
    SELECT id INTO hogshead_id FROM public.cask_types WHERE name = 'European Oak Hogshead';
    SELECT id INTO mizunara_id FROM public.cask_types WHERE name = 'Japanese Mizunara Oak';

    -- Insert test casks with realistic data
    INSERT INTO public.casks (
        id, distillery_id, cask_type_id, spirit_name, cask_number, distillation_date, 
        expected_maturation_years, current_volume_liters, alcohol_percentage, 
        price_per_liter, total_price, available_for_sale, warehouse_location, 
        tasting_notes, blockchain_id, blockchain_hash
    ) VALUES
    -- Highland Spirits Distillery Casks
    ('cask1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', bourbon_barrel_id, 'Highland Single Malt 18 Year', 'HS-BB-2006-001', '2006-03-15', 18, 185.5, 63.2, 450, 83475, true, 'Warehouse A, Block 3, Row 12', 'Rich honey and vanilla with hints of dried fruit and spice. Long, warming finish with notes of toffee and oak.', 'ARIGI-HS-001', '0x1a2b3c4d5e6f7890abcdef1234567890'),
    ('cask1111-1111-1111-1111-111111111112', 'aaaa1111-1111-1111-1111-111111111111', sherry_butt_id, 'Highland Single Malt 25 Year', 'HS-SB-1999-007', '1999-09-22', 25, 465.2, 58.9, 850, 395420, true, 'Warehouse B, Block 1, Row 5', 'Deep mahogany color with rich Christmas cake, dried fruits, and dark chocolate. Exceptional complexity and length.', 'ARIGI-HS-002', '0x2b3c4d5e6f7890ab1234567890abcdef'),
    ('cask1111-1111-1111-1111-111111111113', 'aaaa1111-1111-1111-1111-111111111111', cognac_barrel_id, 'Highland Single Malt 21 Year', 'HS-CB-2003-012', '2003-06-18', 21, 210.8, 61.4, 650, 137020, false, 'Warehouse A, Block 2, Row 8', 'Elegant cognac influence with grape sweetness, leather, and warming spices. Sophisticated and refined character.', 'ARIGI-HS-003', '0x3c4d5e6f7890ab1234567890abcdef12'),

    -- Speyside Premium Whisky Co. Casks  
    ('cask2222-2222-2222-2222-222222222221', 'bbbb2222-2222-2222-2222-222222222222', port_cask_id, 'Speyside Premium 16 Year', 'SP-PC-2008-045', '2008-11-03', 16, 235.7, 59.8, 520, 122564, true, 'Dunnage Warehouse 1, Section C', 'Ruby red influence with berry fruits, dark chocolate, and port wine sweetness. Rich and indulgent profile.', 'ARIGI-SP-001', '0x4d5e6f7890ab1234567890abcdef1234'),
    ('cask2222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', virgin_oak_id, 'Speyside Premium 12 Year', 'SP-VO-2012-089', '2012-04-27', 12, 195.3, 64.1, 380, 74214, true, 'Rack Warehouse 2, Level 4', 'Intense vanilla and coconut from new oak, balanced with orchard fruits and honey. Bold American oak character.', 'ARIGI-SP-002', '0x5e6f7890ab1234567890abcdef123456'),
    ('cask2222-2222-2222-2222-222222222223', 'bbbb2222-2222-2222-2222-222222222222', hogshead_id, 'Speyside Premium 20 Year', 'SP-HH-2004-156', '2004-08-14', 20, 240.1, 57.3, 720, 172872, false, 'Traditional Warehouse 3, Bay 7', 'Classic Speyside character with apple, pear, honey, and gentle oak. Perfect balance of fruit and wood influence.', 'ARIGI-SP-003', '0x6f7890ab1234567890abcdef12345678'),

    -- Islay Smoke & Fire Distillery Casks
    ('cask3333-3333-3333-3333-333333333331', 'cccc3333-3333-3333-3333-333333333333', bourbon_barrel_id, 'Islay Smoke & Fire 15 Year', 'ISF-BB-2009-203', '2009-01-19', 15, 188.9, 62.7, 580, 109562, true, 'Coastal Warehouse 1, Row 15', 'Intense peat smoke with maritime salt, seaweed, and medicinal notes. Classic Islay character with bourbon sweetness.', 'ARIGI-ISF-001', '0x7890ab1234567890abcdef1234567890'),
    ('cask3333-3333-3333-3333-333333333332', 'cccc3333-3333-3333-3333-333333333333', sherry_butt_id, 'Islay Smoke & Fire 22 Year', 'ISF-SB-2002-078', '2002-12-05', 22, 445.6, 55.2, 920, 409952, true, 'Seaside Warehouse 2, Block A', 'Perfect marriage of Islay peat and sherry richness. Smoke, dried fruits, leather, and coastal influences.', 'ARIGI-ISF-002', '0x890ab1234567890abcdef12345678901'),
    ('cask3333-3333-3333-3333-333333333333', 'cccc3333-3333-3333-3333-333333333333', mizunara_id, 'Islay Smoke & Fire 19 Year', 'ISF-MZ-2005-012', '2005-05-30', 19, 165.4, 59.1, 1200, 198480, true, 'Special Cask Warehouse, Climate Controlled', 'Rare Mizunara oak adds incense and sandalwood to signature Islay smoke. Unique and highly sought-after expression.', 'ARIGI-ISF-003', '0x90ab1234567890abcdef123456789012')
    ON CONFLICT DO NOTHING;
END $$;

-- Insert cask ownership records (showing which users own parts of which casks)
INSERT INTO public.cask_ownership (
    id, cask_id, owner_id, ownership_percentage, volume_liters, 
    acquisition_price, acquired_date, is_active
) VALUES
-- James Wellington's investments
('own11111-1111-1111-1111-111111111111', 'cask1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 25.00, 46.38, 20868.75, '2023-08-15 10:30:00+00', true),
('own11111-1111-1111-1111-111111111112', 'cask2222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444444', 40.00, 94.28, 49025.60, '2023-09-22 14:15:00+00', true),

-- Sarah Thompson's portfolio
('own22222-2222-2222-2222-222222222221', 'cask1111-1111-1111-1111-111111111112', '55555555-5555-5555-5555-555555555555', 15.00, 69.78, 59313.00, '2023-07-08 09:45:00+00', true),
('own22222-2222-2222-2222-222222222222', 'cask3333-3333-3333-3333-333333333332', '55555555-5555-5555-5555-555555555555', 30.00, 133.68, 122985.60, '2023-10-03 11:20:00+00', true),

-- Michael Chen's holdings  
('own33333-3333-3333-3333-333333333331', 'cask2222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 50.00, 97.65, 37107.00, '2023-06-12 16:45:00+00', true),
('own33333-3333-3333-3333-333333333332', 'cask3333-3333-3333-3333-333333333331', '66666666-6666-6666-6666-666666666666', 35.00, 66.12, 38346.70, '2023-11-18 13:30:00+00', true),

-- Emma Rodriguez's fund investments
('own44444-4444-4444-4444-444444444441', 'cask1111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 60.00, 111.30, 50085.00, '2023-05-25 08:15:00+00', true),
('own44444-4444-4444-4444-444444444442', 'cask3333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 45.00, 74.43, 89316.00, '2023-12-07 15:00:00+00', true),

-- David Smith's collection
('own55555-5555-5555-5555-555555555551', 'cask2222-2222-2222-2222-222222222221', '88888888-8888-8888-8888-888888888888', 20.00, 47.14, 24512.80, '2023-04-30 12:10:00+00', true),
('own55555-5555-5555-5555-555555555552', 'cask1111-1111-1111-1111-111111111112', '88888888-8888-8888-8888-888888888888', 25.00, 116.30, 98855.00, '2023-08-28 17:25:00+00', true)
ON CONFLICT DO NOTHING;

-- Insert some transaction records for completed purchases
INSERT INTO public.transactions (
    id, cask_id, buyer_id, seller_id, transaction_type, volume_liters, 
    price_per_liter, total_amount, transaction_fee, platform_fee, distillery_fee, 
    status, created_at, completed_at
) VALUES
('txn11111-1111-1111-1111-111111111111', 'cask1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111', 'purchase', 46.38, 450.00, 20871.00, 417.42, 1043.55, 834.84, 'completed', '2023-08-15 10:25:00+00', '2023-08-15 10:35:00+00'),
('txn22222-2222-2222-2222-222222222222', 'cask2222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444444', 'bbbb2222-2222-2222-2222-222222222222', 'purchase', 94.28, 520.00, 49025.60, 980.51, 2451.28, 1961.02, 'completed', '2023-09-22 14:10:00+00', '2023-09-22 14:20:00+00'),
('txn33333-3333-3333-3333-333333333333', 'cask1111-1111-1111-1111-111111111112', '55555555-5555-5555-5555-555555555555', 'aaaa1111-1111-1111-1111-111111111111', 'purchase', 69.78, 850.00, 59313.00, 1186.26, 2965.65, 2372.52, 'completed', '2023-07-08 09:40:00+00', '2023-07-08 09:50:00+00'),
('txn44444-4444-4444-4444-444444444444', 'cask3333-3333-3333-3333-333333333332', '55555555-5555-5555-5555-555555555555', 'cccc3333-3333-3333-3333-333333333333', 'purchase', 133.68, 920.00, 122985.60, 2459.71, 6149.28, 4919.42, 'completed', '2023-10-03 11:15:00+00', '2023-10-03 11:25:00+00'),
('txn55555-5555-5555-5555-555555555555', 'cask2222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'bbbb2222-2222-2222-2222-222222222222', 'purchase', 97.65, 380.00, 37107.00, 742.14, 1855.35, 1484.28, 'completed', '2023-06-12 16:40:00+00', '2023-06-12 16:50:00+00')
ON CONFLICT DO NOTHING;