-- Add Stripe Connect account ID to distilleries table
ALTER TABLE public.distilleries 
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_onboarding_complete boolean DEFAULT false;