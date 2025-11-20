-- Drop existing enum if needed and recreate (to ensure correct values)
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('distillery', 'consumer', 'investor', 'administrator', 'facilitator');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (secure role management)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'administrator')
$$;

-- Create distilleries table
CREATE TABLE IF NOT EXISTS public.distilleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  established_year INTEGER,
  license_number TEXT,
  website TEXT,
  logo_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cask_types table
CREATE TABLE IF NOT EXISTS public.cask_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capacity_liters INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create casks table
CREATE TABLE IF NOT EXISTS public.casks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distillery_id UUID REFERENCES public.distilleries(id) NOT NULL,
  cask_type_id UUID REFERENCES public.cask_types(id) NOT NULL,
  blockchain_id TEXT NOT NULL,
  blockchain_hash TEXT,
  cask_number TEXT NOT NULL,
  spirit_name TEXT NOT NULL,
  distillation_date DATE NOT NULL,
  warehouse_location TEXT,
  current_volume_liters NUMERIC,
  alcohol_percentage NUMERIC,
  expected_maturation_years INTEGER,
  original_cask_type TEXT,
  has_been_finished BOOLEAN DEFAULT false,
  finishing_cask_type TEXT,
  finishing_duration_months INTEGER,
  finishing_notes TEXT,
  tasting_notes TEXT,
  price_per_liter NUMERIC,
  total_price NUMERIC,
  available_for_sale BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cask_images table
CREATE TABLE IF NOT EXISTS public.cask_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cask_id UUID REFERENCES public.casks(id) NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'barrel_photo',
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cask_ownership table
CREATE TABLE IF NOT EXISTS public.cask_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cask_id UUID REFERENCES public.casks(id) NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  volume_liters NUMERIC NOT NULL,
  ownership_percentage NUMERIC NOT NULL,
  acquired_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  acquisition_price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cask_sales table
CREATE TABLE IF NOT EXISTS public.cask_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ownership_id UUID REFERENCES public.cask_ownership(id) NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  asking_price_per_liter NUMERIC NOT NULL,
  total_asking_price NUMERIC NOT NULL,
  volume_for_sale_liters NUMERIC NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  listing_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cask_id UUID REFERENCES public.casks(id) NOT NULL,
  sale_listing_id UUID REFERENCES public.cask_sales(id),
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  transaction_type TEXT NOT NULL,
  volume_liters NUMERIC NOT NULL,
  price_per_liter NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  transaction_fee NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  distillery_fee NUMERIC NOT NULL,
  seller_amount NUMERIC,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  blockchain_transaction_hash TEXT,
  admin_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id),
  recipient_type TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payout',
  description TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fee_structure table
CREATE TABLE IF NOT EXISTS public.fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL,
  description TEXT,
  percentage NUMERIC,
  fixed_amount NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'magic',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  cask_id UUID REFERENCES public.casks(id) NOT NULL,
  max_price NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distilleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cask_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cask_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cask_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cask_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view verified distilleries" ON public.distilleries;
DROP POLICY IF EXISTS "Distillery owners can manage their distillery" ON public.distilleries;
DROP POLICY IF EXISTS "Anyone can view cask types" ON public.cask_types;
DROP POLICY IF EXISTS "Anyone can view available casks" ON public.casks;
DROP POLICY IF EXISTS "Distilleries can manage their casks" ON public.casks;
DROP POLICY IF EXISTS "Anyone can view cask images" ON public.cask_images;
DROP POLICY IF EXISTS "Distilleries can manage images for their casks" ON public.cask_images;
DROP POLICY IF EXISTS "Users can view their own ownership" ON public.cask_ownership;
DROP POLICY IF EXISTS "Users can manage their own ownership" ON public.cask_ownership;
DROP POLICY IF EXISTS "Active sales are viewable" ON public.cask_ownership;
DROP POLICY IF EXISTS "Anyone can view active sales" ON public.cask_sales;
DROP POLICY IF EXISTS "Sellers can manage their sales" ON public.cask_sales;
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their payouts" ON public.payouts;
DROP POLICY IF EXISTS "Admins can manage payouts" ON public.payouts;
DROP POLICY IF EXISTS "Anyone can view active fees" ON public.fee_structure;
DROP POLICY IF EXISTS "Users can view their wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can manage their wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can manage their wishlist" ON public.wishlist;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- RLS Policies for distilleries
CREATE POLICY "Anyone can view verified distilleries" ON public.distilleries FOR SELECT USING (verified = true);
CREATE POLICY "Distillery owners can manage their distillery" ON public.distilleries FOR ALL USING (profile_id = auth.uid());

-- RLS Policies for cask_types
CREATE POLICY "Anyone can view cask types" ON public.cask_types FOR SELECT USING (true);

-- RLS Policies for casks
CREATE POLICY "Anyone can view available casks" ON public.casks FOR SELECT USING (available_for_sale = true);
CREATE POLICY "Distilleries can manage their casks" ON public.casks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.distilleries d WHERE d.id = distillery_id AND d.profile_id = auth.uid())
);

-- RLS Policies for cask_images
CREATE POLICY "Anyone can view cask images" ON public.cask_images FOR SELECT USING (true);
CREATE POLICY "Distilleries can manage images for their casks" ON public.cask_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.casks c
    JOIN public.distilleries d ON c.distillery_id = d.id
    WHERE c.id = cask_id AND d.profile_id = auth.uid()
  )
);

-- RLS Policies for cask_ownership
CREATE POLICY "Users can view their own ownership" ON public.cask_ownership FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can manage their own ownership" ON public.cask_ownership FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Active sales are viewable" ON public.cask_ownership FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cask_sales cs WHERE cs.ownership_id = id AND cs.status = 'active')
);

-- RLS Policies for cask_sales
CREATE POLICY "Anyone can view active sales" ON public.cask_sales FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage their sales" ON public.cask_sales FOR ALL USING (seller_id = auth.uid());

-- RLS Policies for transactions
CREATE POLICY "Users can view their transactions" ON public.transactions FOR SELECT USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);

-- RLS Policies for payouts
CREATE POLICY "Users can view their payouts" ON public.payouts FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Admins can manage payouts" ON public.payouts FOR ALL USING (public.is_admin());

-- RLS Policies for fee_structure
CREATE POLICY "Anyone can view active fees" ON public.fee_structure FOR SELECT USING (is_active = true);

-- RLS Policies for wallets
CREATE POLICY "Users can view their wallets" ON public.wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their wallets" ON public.wallets FOR ALL USING (user_id = auth.uid());

-- RLS Policies for wishlist
CREATE POLICY "Users can manage their wishlist" ON public.wishlist FOR ALL USING (user_id = auth.uid());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_distilleries_updated_at ON public.distilleries;
DROP TRIGGER IF EXISTS update_casks_updated_at ON public.casks;
DROP TRIGGER IF EXISTS update_cask_images_updated_at ON public.cask_images;
DROP TRIGGER IF EXISTS update_cask_ownership_updated_at ON public.cask_ownership;
DROP TRIGGER IF EXISTS update_cask_sales_updated_at ON public.cask_sales;
DROP TRIGGER IF EXISTS update_payouts_updated_at ON public.payouts;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
DROP TRIGGER IF EXISTS update_wishlist_updated_at ON public.wishlist;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_distilleries_updated_at BEFORE UPDATE ON public.distilleries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_casks_updated_at BEFORE UPDATE ON public.casks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cask_images_updated_at BEFORE UPDATE ON public.cask_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cask_ownership_updated_at BEFORE UPDATE ON public.cask_ownership FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cask_sales_updated_at BEFORE UPDATE ON public.cask_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wishlist_updated_at BEFORE UPDATE ON public.wishlist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop and recreate trigger for auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Assign default consumer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consumer'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();