-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('distillery', 'consumer', 'investor');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT, -- For distilleries
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create distilleries table
CREATE TABLE public.distilleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  license_number TEXT,
  established_year INTEGER,
  website TEXT,
  logo_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cask types table
CREATE TABLE public.cask_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  capacity_liters INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create casks table (blockchain-coded casks)
CREATE TABLE public.casks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blockchain_id TEXT NOT NULL UNIQUE, -- Blockchain identifier
  distillery_id UUID NOT NULL REFERENCES public.distilleries(id) ON DELETE RESTRICT,
  cask_type_id UUID NOT NULL REFERENCES public.cask_types(id) ON DELETE RESTRICT,
  spirit_name TEXT NOT NULL,
  distillation_date DATE NOT NULL,
  expected_maturation_years INTEGER,
  current_volume_liters DECIMAL(8,2),
  alcohol_percentage DECIMAL(5,2),
  cask_number TEXT NOT NULL,
  warehouse_location TEXT,
  tasting_notes TEXT,
  price_per_liter DECIMAL(10,2),
  total_price DECIMAL(12,2),
  available_for_sale BOOLEAN DEFAULT true,
  blockchain_hash TEXT, -- Hash for blockchain verification
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(distillery_id, cask_number)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cask_id UUID NOT NULL REFERENCES public.casks(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'transfer', 'sale')),
  volume_liters DECIMAL(8,2) NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  transaction_fee DECIMAL(10,2) NOT NULL,
  distillery_fee DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  blockchain_transaction_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ownership records table
CREATE TABLE public.cask_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cask_id UUID NOT NULL REFERENCES public.casks(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  volume_liters DECIMAL(8,2) NOT NULL,
  ownership_percentage DECIMAL(5,2) NOT NULL,
  acquired_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  acquisition_price DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fee structure table
CREATE TABLE public.fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('transaction', 'distillery', 'platform', 'storage')),
  percentage DECIMAL(5,4),
  fixed_amount DECIMAL(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default cask types
INSERT INTO public.cask_types (name, capacity_liters, description) VALUES
('Bourbon Barrel', 200, 'Ex-bourbon barrel, 53 gallons'),
('Sherry Butt', 500, 'Ex-sherry butt, 132 gallons'),
('Port Pipe', 650, 'Ex-port pipe, 172 gallons'),
('Hogshead', 250, 'Hogshead, 66 gallons'),
('Quarter Cask', 125, 'Quarter cask, 33 gallons');

-- Insert default fee structure
INSERT INTO public.fee_structure (fee_type, percentage, description) VALUES
('transaction', 0.0250, 'Platform transaction fee - 2.5%'),
('distillery', 0.0150, 'Distillery fee - 1.5%'),
('platform', 0.0100, 'Platform service fee - 1.0%');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distilleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cask_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cask_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Distilleries policies
CREATE POLICY "Anyone can view verified distilleries" ON public.distilleries
  FOR SELECT USING (verified = true);

CREATE POLICY "Distillery owners can manage their distillery" ON public.distilleries
  FOR ALL USING (profile_id = auth.uid());

-- Cask types policies (public read)
CREATE POLICY "Anyone can view cask types" ON public.cask_types
  FOR SELECT USING (true);

-- Casks policies
CREATE POLICY "Anyone can view available casks" ON public.casks
  FOR SELECT USING (available_for_sale = true);

CREATE POLICY "Distilleries can manage their casks" ON public.casks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.distilleries d 
      WHERE d.id = casks.distillery_id AND d.profile_id = auth.uid()
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Ownership policies
CREATE POLICY "Users can view their ownership" ON public.cask_ownership
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "System can manage ownership" ON public.cask_ownership
  FOR ALL USING (true);

-- Fee structure policies (public read)
CREATE POLICY "Anyone can view fee structure" ON public.fee_structure
  FOR SELECT USING (is_active = true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer')::user_role,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_distilleries_updated_at BEFORE UPDATE ON public.distilleries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_casks_updated_at BEFORE UPDATE ON public.casks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cask_ownership_updated_at BEFORE UPDATE ON public.cask_ownership
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();