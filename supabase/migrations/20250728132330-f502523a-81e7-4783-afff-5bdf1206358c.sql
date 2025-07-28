-- Create the user_role enum type
CREATE TYPE public.user_role AS ENUM ('distillery', 'consumer', 'investor');

-- Update the profiles table to use the correct enum type
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE public.user_role 
USING role::public.user_role;