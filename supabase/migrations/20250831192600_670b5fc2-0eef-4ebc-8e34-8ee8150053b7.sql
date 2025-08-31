-- Fix authentication by creating a function to get user session
-- This will help debug the auth.uid() issue
SELECT 
  session_id,
  user_id,
  expires_at > now() as is_valid
FROM auth.sessions 
WHERE expires_at > now() 
ORDER BY created_at DESC 
LIMIT 5;