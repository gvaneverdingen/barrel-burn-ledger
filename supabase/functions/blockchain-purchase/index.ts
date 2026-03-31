import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ethers } from "https://esm.sh/ethers@6.13.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Marketplace ABI (only the functions we need)
const MARKETPLACE_ABI = [
  "function purchaseCaskWithToken(uint256 tokenId) external",
  "function getListing(uint256 tokenId) external view returns (tuple(address seller, uint256 price, address paymentToken, bool active, bool isPrimarySale))",
  "function calculateFees(uint256 price, bool isPrimarySale) external pure returns (uint256 platformFee, uint256 distilleryRoyalty, uint256 sellerAmount)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

const CASKNFT_ABI = [
  "function caskIdToTokenId(string) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
];

const RequestSchema = z.object({
  saleId: z.string().uuid("Invalid sale ID"),
  paymentMethod: z.enum(["usdc", "usdt"]),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

// Known stablecoin addresses on Polygon Amoy testnet
const STABLECOIN_ADDRESSES: Record<string, string> = {
  // On testnet we'll use test tokens — these would be replaced with real addresses on mainnet
  usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // Test USDC on Amoy
  usdt: "0x1616d425Cd540B256475cBfb604586C8598eC0FB", // Test USDT on Amoy
};

// Rotating RPC endpoints for Polygon Amoy
const RPC_ENDPOINTS = [
  "https://rpc-amoy.polygon.technology",
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org",
];

async function getProvider(): Promise<ethers.JsonRpcProvider> {
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc, {
        chainId: 80002,
        name: "amoy",
      });
      await provider.getBlockNumber();
      console.log("Connected to RPC:", rpc);
      return provider;
    } catch (e) {
      console.warn("RPC failed:", rpc, e);
    }
  }
  
  // Fallback to env-configured RPC
  const customRpc = Deno.env.get("POLYGON_RPC_URL");
  if (customRpc) {
    const provider = new ethers.JsonRpcProvider(customRpc, {
      chainId: 80002,
      name: "amoy",
    });
    await provider.getBlockNumber();
    return provider;
  }
  
  throw new Error("All RPC endpoints failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user?.id || !user?.email) {
      throw new Error("User not authenticated");
    }

    // Validate input
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      return new Response(JSON.stringify({ error: `Validation failed: ${errors}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { saleId, paymentMethod, walletAddress } = parsed.data;

    // Get sale details
    const { data: sale, error: saleError } = await supabaseService
      .from("cask_sales")
      .select(`
        *,
        cask_ownership (
          *,
          casks (
            *,
            distilleries (name, location)
          )
        )
      `)
      .eq("id", saleId)
      .eq("status", "active")
      .single();

    if (saleError || !sale) {
      throw new Error("Sale listing not found or no longer active");
    }

    if (sale.seller_id === user.id) {
      throw new Error("Cannot purchase your own cask");
    }

    // Check if cask has been minted as NFT
    const cask = sale.cask_ownership.casks;
    if (!cask.nft_token_id && cask.nft_token_id !== 0) {
      throw new Error("Cask must be minted as NFT before blockchain purchase");
    }

    // Connect to blockchain
    const provider = await getProvider();
    const platformKey = Deno.env.get("POLYGON_PRIVATE_KEY");
    if (!platformKey) throw new Error("Platform wallet not configured");
    
    const platformSigner = new ethers.Wallet(platformKey, provider);
    const marketplaceAddress = Deno.env.get("MARKETPLACE_CONTRACT_ADDRESS");
    const caskNftAddress = Deno.env.get("CASK_NFT_CONTRACT_ADDRESS");

    if (!marketplaceAddress || !caskNftAddress) {
      throw new Error("Contract addresses not configured");
    }

    const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, platformSigner);
    const caskNft = new ethers.Contract(caskNftAddress, CASKNFT_ABI, provider);

    // Get the on-chain token ID for this cask
    const tokenId = BigInt(cask.nft_token_id);

    // Check if the cask is listed on the marketplace
    const listing = await marketplace.getListing(tokenId);
    
    // Calculate the price in the appropriate denomination
    const totalPriceDollars = sale.total_asking_price;
    
    // Build transaction data based on payment method
    let txData: any;

    // ERC20 stablecoin payment
    {
      const tokenAddress = STABLECOIN_ADDRESSES[paymentMethod];
      if (!tokenAddress) throw new Error(`Unsupported token: ${paymentMethod}`);
      
      paymentTokenAddress = tokenAddress;
      const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await erc20.decimals();
      const tokenAmount = ethers.parseUnits(totalPriceDollars.toString(), decimals);
      const symbol = await erc20.symbol();

      // Check buyer's token balance
      const balance = await erc20.balanceOf(walletAddress);
      if (balance < tokenAmount) {
        return new Response(JSON.stringify({
          error: `Insufficient ${symbol} balance. Required: ${totalPriceDollars}, Available: ${ethers.formatUnits(balance, decimals)}`,
          requiredApproval: false,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (listing.active) {
        // Check if buyer has approved the marketplace to spend tokens
        const allowance = await erc20.allowance(walletAddress, marketplaceAddress);
        if (allowance < tokenAmount) {
          // Return approval instructions — buyer needs to approve first
          return new Response(JSON.stringify({
            requiresApproval: true,
            approvalDetails: {
              tokenAddress,
              tokenSymbol: symbol,
              spender: marketplaceAddress,
              amount: tokenAmount.toString(),
              amountFormatted: totalPriceDollars.toString(),
              decimals: Number(decimals),
            },
            message: `Please approve ${totalPriceDollars} ${symbol} for the marketplace contract before purchasing.`,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        txData = {
          method: "purchaseCaskWithToken",
          args: [tokenId],
          value: 0n,
        };
      } else {
        // Direct ERC20 transfer
        txData = {
          method: "direct_erc20_transfer",
          tokenAddress,
          to: Deno.env.get("PLATFORM_WALLET_ADDRESS"),
          amount: tokenAmount,
        };
      }
    }

    // Create a pending transaction in the database
    const platformFeeRate = 0.05;
    const platformFeeDollars = Math.round(totalPriceDollars * platformFeeRate * 100) / 100;
    const sellerAmountDollars = Math.round((totalPriceDollars - platformFeeDollars) * 100) / 100;

    const { data: transaction, error: txError } = await supabaseService
      .from("transactions")
      .insert({
        cask_id: cask.id,
        buyer_id: user.id,
        seller_id: sale.seller_id,
        volume_liters: sale.volume_for_sale_liters,
        price_per_liter: sale.asking_price_per_liter,
        total_amount: totalPriceDollars,
        transaction_fee: platformFeeDollars,
        platform_fee: platformFeeDollars,
        distillery_fee: 0,
        seller_amount: sellerAmountDollars,
        transaction_type: "blockchain_purchase",
        sale_listing_id: saleId,
        status: "pending",
      })
      .select()
      .single();

    if (txError) {
      console.error("Transaction creation error:", txError);
      throw new Error("Failed to create transaction record");
    }

    // Return transaction details for the frontend to execute
    // The frontend will sign and submit the transaction from the user's wallet
    const response: any = {
      success: true,
      transactionId: transaction.id,
      paymentMethod,
      contractAddress: listing.active ? marketplaceAddress : null,
      tokenId: tokenId.toString(),
      isOnChainListing: listing.active,
    };

    if (txData.method === "purchaseCaskWithToken") {
      response.txType = "erc20_marketplace";
      response.to = marketplaceAddress;
      response.functionName = "purchaseCaskWithToken";
      response.args = [tokenId.toString()];
      response.abi = ["function purchaseCaskWithToken(uint256 tokenId) external"];
    } else if (txData.method === "direct_erc20_transfer") {
      response.txType = "erc20_direct";
      response.tokenAddress = txData.tokenAddress;
      response.to = txData.to;
      response.amount = txData.amount.toString();
      response.abi = ["function transfer(address to, uint256 amount) external returns (bool)"];
    }

    // Include price info for display
    response.priceInfo = {
      totalUsd: totalPriceDollars,
      platformFeeUsd: platformFeeDollars,
      sellerAmountUsd: sellerAmountDollars,
      paymentToken: paymentTokenAddress === ethers.ZeroAddress ? "MATIC" : paymentMethod.toUpperCase(),
      paymentTokenAddress: paymentTokenAddress,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Blockchain purchase error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Purchase failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});