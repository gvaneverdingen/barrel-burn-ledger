-- Add date_of_birth column to profiles table
ALTER TABLE public.profiles
ADD COLUMN date_of_birth DATE;

-- Add a check constraint to ensure date of birth is not in the future
ALTER TABLE public.profiles
ADD CONSTRAINT check_date_of_birth_not_future 
CHECK (date_of_birth <= CURRENT_DATE);

-- Add a check constraint to ensure reasonable age (not born before 1900)
ALTER TABLE public.profiles
ADD CONSTRAINT check_date_of_birth_reasonable 
CHECK (date_of_birth >= '1900-01-01'::DATE);