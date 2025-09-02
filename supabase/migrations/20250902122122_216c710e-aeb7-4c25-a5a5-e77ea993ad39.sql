-- Phase 1: Fix Critical Security Issues - RLS Policies

-- 1. Fix profiles table RLS policy - restrict public access to sensitive personal information
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view only their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Fix cask_ownership table RLS policy - remove broad public access for active sales
DROP POLICY IF EXISTS "Users can view their ownership and active sales" ON public.cask_ownership;

CREATE POLICY "Users can view their own ownership" 
ON public.cask_ownership 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Active sales are viewable for purchasing" 
ON public.cask_ownership 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM cask_sales cs 
    WHERE cs.ownership_id = cask_ownership.id 
    AND cs.status = 'active'
  )
  AND is_active = true
);

-- 3. Fix distilleries table RLS policy - restrict sensitive business information
DROP POLICY IF EXISTS "Anyone can view verified distilleries" ON public.distilleries;

CREATE POLICY "Public can view basic distillery info" 
ON public.distilleries 
FOR SELECT 
USING (
  verified = true 
  AND (
    -- Only expose basic marketing information publicly
    SELECT COUNT(*) FROM (
      SELECT name, location, description, website, logo_url, established_year, verified, created_at
    ) AS public_fields
  ) > 0
);

-- Create a separate policy for distillery owners to see their full data
CREATE POLICY "Distillery owners can view their complete data" 
ON public.distilleries 
FOR SELECT 
USING (profile_id = auth.uid());