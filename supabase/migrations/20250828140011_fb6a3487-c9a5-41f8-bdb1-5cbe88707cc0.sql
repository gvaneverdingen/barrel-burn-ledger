-- Fix security issue: Replace overly permissive system policies with proper admin-only access

-- First, drop the existing overly permissive policies
DROP POLICY IF EXISTS "System can manage ownership" ON public.cask_ownership;
DROP POLICY IF EXISTS "System can manage all payouts" ON public.payouts;

-- Create a security definer function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'administrator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create proper admin policies for cask_ownership table
CREATE POLICY "Admins can manage all ownership records" 
ON public.cask_ownership 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert their own ownership" 
ON public.cask_ownership 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own ownership" 
ON public.cask_ownership 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Create proper admin policies for payouts table  
CREATE POLICY "Admins can manage all payouts" 
ON public.payouts 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "System can create payouts for transactions" 
ON public.payouts 
FOR INSERT 
WITH CHECK (
  -- Allow creation if the payout is for a valid transaction participant
  EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_id 
    AND (t.buyer_id = recipient_id OR t.seller_id = recipient_id)
  )
);

-- Add policy for distilleries to view payouts for their transactions
CREATE POLICY "Distilleries can view their transaction payouts" 
ON public.payouts 
FOR SELECT 
USING (
  recipient_type = 'distillery' 
  AND EXISTS (
    SELECT 1 FROM public.distilleries d 
    WHERE d.profile_id = auth.uid() 
    AND d.profile_id = recipient_id
  )
);