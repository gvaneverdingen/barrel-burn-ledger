import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Mint cask NFT function called");

    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user (must be a distillery)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Verify user is a distillery
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'distillery') {
      throw new Error("Only distilleries can mint cask NFTs");
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

    if (cask.distillery.profile_id !== user.id) {
      throw new Error("You can only mint NFTs for your own casks");
    }

    if (cask.blockchain_hash) {
      throw new Error("This cask has already been minted as an NFT");
    }

    // Prepare NFT metadata
    const nftMetadata = {
      name: `${cask.spirit_name} - Cask #${cask.cask_number}`,
      description: `Premium whisky cask from ${cask.distillery.name}. ${cask.tasting_notes}`,
      image: generateCaskImageUrl(cask),
      attributes: [
        { trait_type: "Distillery", value: cask.distillery.name },
        { trait_type: "Spirit Name", value: cask.spirit_name },
        { trait_type: "Cask Number", value: cask.cask_number },
        { trait_type: "Distillation Date", value: cask.distillation_date },
        { trait_type: "Volume (Liters)", value: cask.current_volume_liters },
        { trait_type: "Alcohol Percentage", value: cask.alcohol_percentage },
        { trait_type: "Maturation Years", value: cask.expected_maturation_years },
        { trait_type: "Warehouse Location", value: cask.warehouse_location }
      ],
      external_url: `${Deno.env.get("FRONTEND_URL") || "https://arigi.co"}/cask/${cask.id}`,
      blockchain_id: cask.blockchain_id
    };

    // Call blockchain logger to mint the NFT
    const mintResponse = await supabaseClient.functions.invoke('blockchain-logger', {
      body: {
        caskId: cask.id,
        buyerId: user.id,
        transactionType: 'mint',
        volume: cask.current_volume_liters,
        price: cask.total_price,
        timestamp: Date.now(),
        metadata: nftMetadata
      }
    });

    if (mintResponse.error) {
      console.error("Error minting NFT:", mintResponse.error);
      throw new Error("Failed to mint NFT on blockchain");
    }

    console.log("Successfully minted cask NFT");

    return new Response(JSON.stringify({
      success: true,
      transactionHash: mintResponse.data.transactionHash,
      blockNumber: mintResponse.data.blockNumber,
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

// Generate a placeholder image URL for the cask
function generateCaskImageUrl(cask: any): string {
  // In production, this would generate or point to actual cask images
  const baseUrl = "https://images.unsplash.com/photo-1569529465841-dfecdab7503b"; // Whisky barrel image
  return `${baseUrl}?w=500&h=500&fit=crop&auto=format`;
}