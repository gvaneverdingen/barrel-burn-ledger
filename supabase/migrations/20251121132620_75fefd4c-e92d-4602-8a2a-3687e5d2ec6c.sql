-- Add constraints to ensure casks have required pricing data when available for sale
-- This uses a CHECK constraint that only applies when available_for_sale is true

-- First, let's create a validation function
CREATE OR REPLACE FUNCTION public.validate_cask_pricing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if the cask is marked as available for sale
  IF NEW.available_for_sale = true THEN
    -- Check that all required pricing fields are not null
    IF NEW.price_per_liter IS NULL THEN
      RAISE EXCEPTION 'Casks available for sale must have price_per_liter set';
    END IF;
    
    IF NEW.total_price IS NULL THEN
      RAISE EXCEPTION 'Casks available for sale must have total_price set';
    END IF;
    
    IF NEW.current_volume_liters IS NULL THEN
      RAISE EXCEPTION 'Casks available for sale must have current_volume_liters set';
    END IF;
    
    IF NEW.alcohol_percentage IS NULL THEN
      RAISE EXCEPTION 'Casks available for sale must have alcohol_percentage set';
    END IF;
    
    -- Validate that prices are positive
    IF NEW.price_per_liter <= 0 THEN
      RAISE EXCEPTION 'price_per_liter must be greater than 0';
    END IF;
    
    IF NEW.total_price <= 0 THEN
      RAISE EXCEPTION 'total_price must be greater than 0';
    END IF;
    
    IF NEW.current_volume_liters <= 0 THEN
      RAISE EXCEPTION 'current_volume_liters must be greater than 0';
    END IF;
    
    IF NEW.alcohol_percentage <= 0 OR NEW.alcohol_percentage > 100 THEN
      RAISE EXCEPTION 'alcohol_percentage must be between 0 and 100';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate cask pricing before insert or update
DROP TRIGGER IF EXISTS validate_cask_pricing_trigger ON public.casks;
CREATE TRIGGER validate_cask_pricing_trigger
  BEFORE INSERT OR UPDATE ON public.casks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cask_pricing();

COMMENT ON FUNCTION public.validate_cask_pricing() IS 'Ensures casks have complete pricing data when marked as available for sale';