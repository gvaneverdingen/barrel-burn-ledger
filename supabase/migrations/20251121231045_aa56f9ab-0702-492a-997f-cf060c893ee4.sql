-- Add smart contract tracking columns to casks table
ALTER TABLE public.casks
ADD COLUMN nft_token_id BIGINT,
ADD COLUMN nft_contract_address TEXT,
ADD COLUMN nft_minted_at TIMESTAMP WITH TIME ZONE;

-- Create blockchain_logs table for tracking all blockchain transactions
CREATE TABLE public.blockchain_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  cask_id UUID REFERENCES public.casks(id) ON DELETE CASCADE,
  blockchain_hash TEXT NOT NULL,
  contract_address TEXT,
  token_id BIGINT,
  block_number INTEGER,
  gas_used NUMERIC,
  transaction_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blockchain_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for blockchain_logs
CREATE POLICY "Anyone can view blockchain logs"
  ON public.blockchain_logs
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert blockchain logs"
  ON public.blockchain_logs
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_blockchain_logs_transaction_id ON public.blockchain_logs(transaction_id);
CREATE INDEX idx_blockchain_logs_cask_id ON public.blockchain_logs(cask_id);
CREATE INDEX idx_blockchain_logs_token_id ON public.blockchain_logs(token_id);
CREATE INDEX idx_blockchain_logs_blockchain_hash ON public.blockchain_logs(blockchain_hash);

-- Add comment
COMMENT ON TABLE public.blockchain_logs IS 'Tracks all blockchain transactions for audit and transparency';
