-- First check what policies exist on cask_ownership
SELECT policyname FROM pg_policies WHERE tablename = 'cask_ownership' AND schemaname = 'public';