-- Insert standard cask types for whisky maturation
INSERT INTO public.cask_types (name, description, capacity_liters) VALUES
  ('Bourbon Barrel', 'Ex-bourbon American oak barrels, typically 200 liters. Imparts vanilla, caramel, and sweet oak flavors.', 200),
  ('Sherry Butt', 'Large European oak casks previously used for sherry, typically 500 liters. Adds rich fruit, spice, and nutty notes.', 500),
  ('Sherry Hogshead', 'Medium-sized European oak casks from sherry production, around 250 liters. Contributes dried fruit and warming spice character.', 250),
  ('Port Wine Cask', 'Casks previously used for port wine maturation. Adds berry fruits, chocolate, and sweet wine notes.', 250),
  ('Cognac Barrel', 'French oak barrels from cognac production. Imparts elegant grape, vanilla, and subtle spice notes.', 300),
  ('Madeira Cask', 'Casks from Madeira wine production. Adds tropical fruit, toffee, and wine-soaked character.', 400),
  ('Mizunara Oak', 'Rare Japanese oak casks. Provides unique sandalwood, incense, and oriental spice notes.', 200),
  ('Virgin American Oak', 'New American oak barrels, never used before. Delivers bold vanilla, coconut, and strong oak influence.', 200),
  ('Quarter Cask', 'Smaller barrels of around 125 liters. Provides faster maturation and intense oak character.', 125)
ON CONFLICT DO NOTHING;