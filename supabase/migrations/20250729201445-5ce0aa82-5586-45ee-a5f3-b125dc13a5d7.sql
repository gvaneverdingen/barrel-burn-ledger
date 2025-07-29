-- Create payouts table to track payments to distilleries and fees
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  recipient_id UUID, -- NULL for platform fees, profile ID for others
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('distillery', 'investor', 'platform')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  fee_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payout' CHECK (status IN ('pending_payout', 'processing', 'completed', 'failed', 'collected')),
  description TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payouts" 
ON public.payouts 
FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "System can manage all payouts" 
ON public.payouts 
FOR ALL 
USING (true);

-- Add indexes
CREATE INDEX idx_payouts_recipient_id ON public.payouts(recipient_id);
CREATE INDEX idx_payouts_transaction_id ON public.payouts(transaction_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- Add admin_notes column to transactions table for approval tracking
ALTER TABLE public.transactions 
ADD COLUMN admin_notes TEXT;