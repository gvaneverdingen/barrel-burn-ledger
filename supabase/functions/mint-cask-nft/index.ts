import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Mint cask NFT function called");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Verify user has distillery role (roles are in user_roles table, not profiles)
    const { data: roleData, error: roleError } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      throw new Error("Unable to verify mint permissions");
    }

    const roles = roleData?.map(({ role }) => role) || [];
    const isAdministrator = roles.includes('administrator');
    const isDistillery = roles.includes('distillery');

    if (!isAdministrator && !isDistillery) {
      throw new Error("Only distilleries or administrators can mint cask NFTs");
    }

    // Parse request body
    const { caskId } = await req.json();
    
    if (!caskId) {
      throw new Error("Cask ID is required");
    }

    console.log("Minting NFT for cask:", caskId);

    // Get cask details and verify ownership
    const { data: cask, error: caskError } = await supabaseService
      .from('casks')
      .select(`
        *,
        distillery:distilleries!inner(
          id,
          name,
          profile_id
        )
      `)
      .eq('id', caskId)
      .single();

    if (caskError || !cask) {
      throw new Error("Cask not found");
    }

    if (!isAdministrator && cask.distillery.profile_id !== user.id) {
      throw new Error("You can only mint NFTs for your own casks");
    }

    if (cask.nft_token_id !== null) {
      throw new Error("This cask has already been minted as an NFT");
    }

    // Get user's wallet address
    const { data: walletData } = await supabaseService
      .from('wallets')
      .select('wallet_address')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    // Prepare NFT metadata
    const nftMetadata = {
      name: `${cask.spirit_name} - Cask #${cask.cask_number}`,
      description: `Premium whisky cask from ${cask.distillery.name}. ${cask.tasting_notes || ''}`,
      image: generateCaskImageUrl(cask),
      attributes: [
        { trait_type: "Distillery", value: cask.distillery.name },
        { trait_type: "Spirit Name", value: cask.spirit_name },
        { trait_type: "Cask Number", value: cask.cask_number },
        { trait_type: "Distillation Date", value: cask.distillation_date },
        { trait_type: "Volume (Liters)", value: cask.current_volume_liters },
        { trait_type: "Alcohol Percentage", value: cask.alcohol_percentage },
        { trait_type: "Maturation Years", value: cask.expected_maturation_years },
        { trait_type: "Warehouse Location", value: cask.warehouse_location },
        { trait_type: "Rarity Tier", value: cask.rarity_tier || 1 },
        { trait_type: "Region", value: cask.region || "Unknown" },
        { trait_type: "Single Barrel", value: cask.is_single_barrel ? "Yes" : "No" },
      ],
      external_url: `https://arigi.co/cask/${cask.id}`,
      blockchain_id: cask.blockchain_id
    };

    // Call blockchain logger to mint the NFT on Polygon
    const blockchainLoggerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/blockchain-logger`;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!serviceRoleKey) {
      throw new Error("Blockchain logger is not configured correctly");
    }

    const mintResponse = await fetch(blockchainLoggerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({
        caskId: cask.id,
        buyerId: walletData?.wallet_address || user.id,
        transactionType: 'mint',
        volume: cask.current_volume_liters || 0,
        price: cask.total_price || 0,
        timestamp: Date.now(),
        metadata: nftMetadata
      })
    });

    const result = await mintResponse.json();

    if (!mintResponse.ok) {
      console.error("Error minting NFT:", result);
      throw new Error(result?.error || "Failed to mint NFT on blockchain");
    }

    if (!result?.success) {
      throw new Error(result?.error || "Blockchain minting failed");
    }

    console.log("Successfully minted cask NFT:", result);

    return new Response(JSON.stringify({
      success: true,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      tokenId: result.tokenId,
      contractAddress: result.contractAddress,
      metadata: nftMetadata,
      message: "Cask NFT minted successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("NFT minting error:", error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateCaskImageUrl(cask: any): string {
  const baseUrl = "https://images.unsplash.com/photo-1569529465841-dfecdab7503b";
  return `${baseUrl}?w=500&h=500&fit=crop&auto=format`;
}
