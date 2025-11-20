-- Performance optimization: Add indexes for frequently queried columns

-- Index for cask marketplace queries (filter by availability and distillery)
CREATE INDEX IF NOT EXISTS idx_casks_available_for_sale ON public.casks(available_for_sale) WHERE available_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_casks_distillery_id ON public.casks(distillery_id);
CREATE INDEX IF NOT EXISTS idx_casks_created_at ON public.casks(created_at DESC);

-- Index for cask sales queries (active listings)
CREATE INDEX IF NOT EXISTS idx_cask_sales_status ON public.cask_sales(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cask_sales_seller_id ON public.cask_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_cask_sales_ownership_id ON public.cask_sales(ownership_id);

-- Index for ownership queries
CREATE INDEX IF NOT EXISTS idx_cask_ownership_owner_id ON public.cask_ownership(owner_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cask_ownership_cask_id ON public.cask_ownership(cask_id);

-- Index for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Index for wishlist queries
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_cask_id ON public.wishlist(cask_id);

-- Index for user roles lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Index for wallet queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_wallet_address ON public.wallets(wallet_address);

-- Composite index for common marketplace query patterns
CREATE INDEX IF NOT EXISTS idx_casks_sale_distillery ON public.casks(available_for_sale, distillery_id, created_at DESC);

-- Index for cask images
CREATE INDEX IF NOT EXISTS idx_cask_images_cask_id ON public.cask_images(cask_id);
CREATE INDEX IF NOT EXISTS idx_cask_images_is_primary ON public.cask_images(cask_id, is_primary) WHERE is_primary = true;