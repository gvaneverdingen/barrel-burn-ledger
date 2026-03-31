

## Plan: Remove MATIC as Payment Option

Remove the native MATIC/POL payment method from the blockchain checkout flow, keeping only USDC and USDT stablecoins alongside Stripe.

### Changes

**1. `src/components/PaymentMethodDialog.tsx`**
- Remove `"native"` from the `PaymentMethod` type
- Remove the MATIC payment option object from the `PAYMENT_METHODS` array
- Remove any UI references to "MATIC" in the confirmation step badge

**2. `supabase/functions/blockchain-purchase/index.ts`**
- Remove `"native"` from the `paymentMethod` zod enum (keep `"usdc"` and `"usdt"`)
- Remove the entire `if (paymentMethod === "native")` block (~20 lines) that handles MATIC price conversion and native transfer logic
- Remove the `"direct_transfer"` and `"native_marketplace"` / `"native_direct"` response branches
- Clean up the `priceInfo.paymentToken` ternary that references MATIC

**3. `supabase/contracts/contracts/CaskMarketplace.sol`**
- Remove the `purchaseCask` payable function that accepts native MATIC
- Keep only `purchaseCaskWithToken` for ERC20 stablecoin purchases

### What stays unchanged
- Stripe payment option (unchanged)
- USDC and USDT stablecoin options (unchanged)
- Gas fees still paid in MATIC (this is unavoidable on Polygon — it's the network fee, not a payment method)
- `blockchain-logger` and `BlockchainTesting` references to MATIC for gas/faucet info (these are about network operations, not payment)

