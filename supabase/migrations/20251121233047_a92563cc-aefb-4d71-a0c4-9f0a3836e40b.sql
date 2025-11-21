-- Add rarity attributes to casks table
ALTER TABLE public.casks
ADD COLUMN age_years integer,
ADD COLUMN rarity_tier integer CHECK (rarity_tier >= 1 AND rarity_tier <= 5),
ADD COLUMN special_finish text,
ADD COLUMN quality_grade text,
ADD COLUMN region text,
ADD COLUMN is_single_barrel boolean DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN public.casks.rarity_tier IS 'Rarity classification: 1=Common, 2=Uncommon, 3=Rare, 4=Epic, 5=Legendary';
COMMENT ON COLUMN public.casks.age_years IS 'Current age of the cask in years';
COMMENT ON COLUMN public.casks.special_finish IS 'Special finishing information (e.g., Sauternes Finish, Rum Cask)';
COMMENT ON COLUMN public.casks.quality_grade IS 'Quality classification (e.g., Select, Reserve, Ultra-Premium)';
COMMENT ON COLUMN public.casks.region IS 'Production region (e.g., Speyside, Islay, Highland)';
COMMENT ON COLUMN public.casks.is_single_barrel IS 'Whether this is a single barrel cask';