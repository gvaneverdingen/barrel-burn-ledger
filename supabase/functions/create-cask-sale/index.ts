import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSaleRequest {
  ownershipId: string;
  askingPricePerLiter: number;
  volumeForSale: number;
  notes?: string;
  expiresInDays?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;

    const { ownershipId, askingPricePerLiter, volumeForSale, notes, expiresInDays }: CreateSaleRequest = await req.json();

    // Validate the ownership record belongs to the user and has enough volume
    const { data: ownership, error: ownershipError } = await supabaseClient
      .from("cask_ownership")
      .select("*")
      .eq("id", ownershipId)
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .single();

    if (ownershipError || !ownership) {
      throw new Error("Invalid ownership record or insufficient permissions");
    }

    if (ownership.volume_liters < volumeForSale) {
      throw new Error("Cannot sell more volume than owned");
    }

    // Check if there's already an active sale for this ownership
    const { data: existingSale } = await supabaseClient
      .from("cask_sales")
      .select("id")
      .eq("ownership_id", ownershipId)
      .eq("status", "active")
      .single();

    if (existingSale) {
      throw new Error("There's already an active sale for this cask ownership");
    }

    const totalAskingPrice = askingPricePerLiter * volumeForSale;
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null;

    // Create the sale listing
    const { data: sale, error: saleError } = await supabaseClient
      .from("cask_sales")
      .insert({
        ownership_id: ownershipId,
        seller_id: user.id,
        asking_price_per_liter: askingPricePerLiter,
        total_asking_price: totalAskingPrice,
        volume_for_sale_liters: volumeForSale,
        notes,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (saleError) {
      throw new Error(`Failed to create sale listing: ${saleError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sale,
        message: "Cask listing created successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating cask sale:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});