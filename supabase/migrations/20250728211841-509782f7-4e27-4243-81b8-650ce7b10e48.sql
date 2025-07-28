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

-- Create some test casks directly (these will be available for sale)
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

    -- Create a default distillery ID for test casks (we'll use a UUID that doesn't reference users)
    INSERT INTO public.distilleries (id, profile_id, name, location, description, license_number, established_year, verified, website) VALUES
    ('test-dist-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Highland Heritage Distillery', 'Speyside, Scotland', 'Traditional Highland single malt distillery with over 150 years of whisky-making excellence.', 'SCT-HHD-1870', 1870, true, 'https://highland-heritage.co.uk'),
    ('test-dist-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Speyside Crown Distillery', 'Speyside, Scotland', 'Award-winning distillery producing premium aged single malts with exceptional character.', 'SCT-SCD-1925', 1925, true, 'https://speyside-crown.com'),
    ('test-dist-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Islay Storm Distillery', 'Islay, Scotland', 'Bold peated whiskies with intense maritime character from the windswept shores of Islay.', 'SCT-ISD-1952', 1952, true, 'https://islay-storm.co.uk')
    ON CONFLICT DO NOTHING;

    -- Insert diverse test casks with different ages, wood types, and characteristics
    INSERT INTO public.casks (
        id, distillery_id, cask_type_id, spirit_name, cask_number, distillation_date, 
        expected_maturation_years, current_volume_liters, alcohol_percentage, 
        price_per_liter, total_price, available_for_sale, warehouse_location, 
        tasting_notes, blockchain_id, blockchain_hash
    ) VALUES
    -- Highland Heritage Distillery Casks
    ('test-cask-1111-1111-1111-111111111111', 'test-dist-1111-1111-1111-111111111111', bourbon_barrel_id, 'Highland Heritage 18 Year Single Malt', 'HH-BB-2006-001', '2006-03-15', 18, 185.5, 63.2, 450, 83475, true, 'Warehouse A, Block 3, Row 12', 'Rich honey and vanilla with hints of dried fruit and spice. Long, warming finish with notes of toffee and oak.', 'ARIGI-HH-001', '0x1a2b3c4d5e6f7890abcdef1234567890'),
    
    ('test-cask-1111-1111-1111-111111111112', 'test-dist-1111-1111-1111-111111111111', sherry_butt_id, 'Highland Heritage 25 Year Reserve', 'HH-SB-1999-007', '1999-09-22', 25, 465.2, 58.9, 850, 395420, true, 'Warehouse B, Block 1, Row 5', 'Deep mahogany color with rich Christmas cake, dried fruits, and dark chocolate. Exceptional complexity and length.', 'ARIGI-HH-002', '0x2b3c4d5e6f7890ab1234567890abcdef'),
    
    ('test-cask-1111-1111-1111-111111111113', 'test-dist-1111-1111-1111-111111111111', cognac_barrel_id, 'Highland Heritage 21 Year Cognac Finish', 'HH-CB-2003-012', '2003-06-18', 21, 210.8, 61.4, 650, 137020, true, 'Warehouse A, Block 2, Row 8', 'Elegant cognac influence with grape sweetness, leather, and warming spices. Sophisticated and refined character.', 'ARIGI-HH-003', '0x3c4d5e6f7890ab1234567890abcdef12'),

    -- Speyside Crown Distillery Casks  
    ('test-cask-2222-2222-2222-222222222221', 'test-dist-2222-2222-2222-222222222222', port_cask_id, 'Speyside Crown 16 Year Port Finish', 'SC-PC-2008-045', '2008-11-03', 16, 235.7, 59.8, 520, 122564, true, 'Dunnage Warehouse 1, Section C', 'Ruby red influence with berry fruits, dark chocolate, and port wine sweetness. Rich and indulgent profile.', 'ARIGI-SC-001', '0x4d5e6f7890ab1234567890abcdef1234'),
    
    ('test-cask-2222-2222-2222-222222222222', 'test-dist-2222-2222-2222-222222222222', virgin_oak_id, 'Speyside Crown 12 Year Virgin Oak', 'SC-VO-2012-089', '2012-04-27', 12, 195.3, 64.1, 380, 74214, true, 'Rack Warehouse 2, Level 4', 'Intense vanilla and coconut from new oak, balanced with orchard fruits and honey. Bold American oak character.', 'ARIGI-SC-002', '0x5e6f7890ab1234567890abcdef123456'),
    
    ('test-cask-2222-2222-2222-222222222223', 'test-dist-2222-2222-2222-222222222222', hogshead_id, 'Speyside Crown 20 Year Classic', 'SC-HH-2004-156', '2004-08-14', 20, 240.1, 57.3, 720, 172872, true, 'Traditional Warehouse 3, Bay 7', 'Classic Speyside character with apple, pear, honey, and gentle oak. Perfect balance of fruit and wood influence.', 'ARIGI-SC-003', '0x6f7890ab1234567890abcdef12345678'),

    ('test-cask-2222-2222-2222-222222222224', 'test-dist-2222-2222-2222-222222222222', madeira_cask_id, 'Speyside Crown 14 Year Madeira Finish', 'SC-MD-2010-078', '2010-02-11', 14, 385.6, 60.5, 420, 161952, true, 'Climate Controlled Warehouse 4', 'Tropical fruit and honey from Madeira casks, with vanilla and citrus notes. Smooth and complex finish.', 'ARIGI-SC-004', '0xa1b2c3d4e5f67890abcdef1234567890'),

    -- Islay Storm Distillery Casks
    ('test-cask-3333-3333-3333-333333333331', 'test-dist-3333-3333-3333-333333333333', bourbon_barrel_id, 'Islay Storm 15 Year Peated', 'IS-BB-2009-203', '2009-01-19', 15, 188.9, 62.7, 580, 109562, true, 'Coastal Warehouse 1, Row 15', 'Intense peat smoke with maritime salt, seaweed, and medicinal notes. Classic Islay character with bourbon sweetness.', 'ARIGI-IS-001', '0x7890ab1234567890abcdef1234567890'),
    
    ('test-cask-3333-3333-3333-333333333332', 'test-dist-3333-3333-3333-333333333333', sherry_butt_id, 'Islay Storm 22 Year Sherry Matured', 'IS-SB-2002-078', '2002-12-05', 22, 445.6, 55.2, 920, 409952, true, 'Seaside Warehouse 2, Block A', 'Perfect marriage of Islay peat and sherry richness. Smoke, dried fruits, leather, and coastal influences.', 'ARIGI-IS-002', '0x890ab1234567890abcdef12345678901'),
    
    ('test-cask-3333-3333-3333-333333333333', 'test-dist-3333-3333-3333-333333333333', mizunara_id, 'Islay Storm 19 Year Mizunara Limited', 'IS-MZ-2005-012', '2005-05-30', 19, 165.4, 59.1, 1200, 198480, true, 'Special Cask Warehouse, Climate Controlled', 'Rare Mizunara oak adds incense and sandalwood to signature Islay smoke. Unique and highly sought-after expression.', 'ARIGI-IS-003', '0x90ab1234567890abcdef123456789012'),

    -- Additional variety casks with different characteristics
    ('test-cask-4444-4444-4444-444444444441', 'test-dist-1111-1111-1111-111111111111', bourbon_barrel_id, 'Highland Heritage 10 Year Entry Level', 'HH-BB-2014-156', '2014-07-22', 10, 195.0, 65.3, 280, 54600, true, 'Warehouse C, Block 5', 'Young and vibrant with green apple, honey, and light oak. Perfect introduction to Highland whisky.', 'ARIGI-HH-004', '0xdef1234567890abcdef1234567890ab'),

    ('test-cask-4444-4444-4444-444444444442', 'test-dist-2222-2222-2222-222222222222', sherry_butt_id, 'Speyside Crown 30 Year Ultra Premium', 'SC-SB-1994-001', '1994-12-31', 30, 420.8, 52.1, 1500, 631200, true, 'Heritage Warehouse 1, Special Reserve', 'Three decades of maturation creates an extraordinary whisky with unparalleled depth and complexity.', 'ARIGI-SC-005', '0x1234567890abcdef1234567890abcdef'),

    ('test-cask-4444-4444-4444-444444444443', 'test-dist-3333-3333-3333-333333333333', port_cask_id, 'Islay Storm 13 Year Port Finished', 'IS-PC-2011-089', '2011-08-14', 13, 220.5, 61.8, 475, 104737, true, 'Experimental Warehouse 3', 'Innovative port finish balances Islay peat with sweet berry and chocolate notes. Limited experimental release.', 'ARIGI-IS-004', '0x567890abcdef1234567890abcdef1234')
    ON CONFLICT DO NOTHING;
END $$;