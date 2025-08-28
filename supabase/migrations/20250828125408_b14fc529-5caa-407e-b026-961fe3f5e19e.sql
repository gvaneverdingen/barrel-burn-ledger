-- Add new roles to the user_role enum
ALTER TYPE public.user_role ADD VALUE 'administrator';
ALTER TYPE public.user_role ADD VALUE 'facilitator';