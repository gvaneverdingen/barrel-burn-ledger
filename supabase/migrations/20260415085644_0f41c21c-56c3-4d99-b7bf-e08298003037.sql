
-- Drop the permissive INSERT policy that lets any authenticated user insert transactions
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;

-- Only service_role (edge functions) can insert transactions
CREATE POLICY "Only service role can insert transactions"
ON public.transactions
FOR INSERT
TO service_role
WITH CHECK (true);
