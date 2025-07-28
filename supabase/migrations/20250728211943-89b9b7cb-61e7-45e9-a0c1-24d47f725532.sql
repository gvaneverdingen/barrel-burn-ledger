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