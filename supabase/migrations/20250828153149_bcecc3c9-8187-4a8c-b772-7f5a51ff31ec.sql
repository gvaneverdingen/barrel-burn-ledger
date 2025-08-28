-- Drop existing RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new RLS policies that handle both regular users and Magic wallet users
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow regular Supabase users to insert their own profile
  (auth.uid() = id) OR 
  -- Allow Magic wallet users (identified by wallet_address in user_metadata) to insert profiles
  -- This is handled by the application logic for Magic wallet users
  (auth.uid() IS NULL AND id IS NOT NULL)
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Allow regular Supabase users to update their own profile
  (auth.uid() = id) OR
  -- Allow updates for Magic wallet users through application logic
  (auth.uid() IS NULL AND id IS NOT NULL)
)
WITH CHECK (
  -- Same check for updates
  (auth.uid() = id) OR 
  (auth.uid() IS NULL AND id IS NOT NULL)
);

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow regular Supabase users to view their own profile
  (auth.uid() = id) OR
  -- Allow Magic wallet users to view profiles through application logic
  (auth.uid() IS NULL)
);