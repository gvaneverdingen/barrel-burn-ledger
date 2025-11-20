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
    const requestBody: CreateSaleRequest & { userId?: string } = await req.json();
    const { ownershipId, askingPricePerLiter, volumeForSale, notes, expiresInDays, userId } = requestBody;

    let authenticatedUserId: string;
    
    // Try regular Supabase authentication first
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer ") {
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
      if (!userError && userData.user) {
        authenticatedUserId = userData.user.id;
        console.log("✅ Regular Supabase user authenticated:", authenticatedUserId);
      } else if (userId) {
        // Magic wallet user - verify they exist in profiles
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        const { data: profile } = await serviceClient
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();
          
        if (profile) {
          authenticatedUserId = userId;
          console.log("✅ Magic wallet user verified:", authenticatedUserId);
        } else {
          throw new Error("Magic wallet user not found in profiles");
        }
      } else {
        throw new Error("User not authenticated");
      }
    } else if (userId) {
      // No auth header but userId provided - Magic wallet user
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
        
      if (profile) {
        authenticatedUserId = userId;
        console.log("✅ Magic wallet user verified:", authenticatedUserId);
      } else {
        throw new Error("Magic wallet user not found in profiles");
      }
    } else {
      throw new Error("Authorization required");
    }

    // Use service role client for all database operations to ensure they work
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Validate the ownership record belongs to the user and has enough volume
    const { data: ownership, error: ownershipError } = await supabaseClient
      .from("cask_ownership")
      .select("*")
      .eq("id", ownershipId)
      .eq("owner_id", authenticatedUserId)
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
        seller_id: authenticatedUserId,
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

    // Send sale created email notification in background
    const sendSaleCreatedEmail = async () => {
      try {
        const { data: sellerProfile } = await supabaseClient
          .from("profiles")
          .select("email, first_name, last_name")
          .eq("id", authenticatedUserId)
          .single();

        const { data: caskData } = await supabaseClient
          .from("cask_ownership")
          .select(`
            casks (
              spirit_name,
              cask_number,
              distilleries (name)
            )
          `)
          .eq("id", ownershipId)
          .single();

        if (sellerProfile?.email && caskData?.casks) {
          await fetch("https://vnmmjmxhtbplfkdughxu.supabase.co/functions/v1/send-transaction-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "sale_created",
              recipientEmail: sellerProfile.email,
              recipientName: `${sellerProfile.first_name || ''} ${sellerProfile.last_name || ''}`.trim(),
              caskName: caskData.casks.spirit_name || "Whisky Cask",
              caskNumber: caskData.casks.cask_number || "N/A",
              distilleryName: caskData.casks.distilleries?.name || "Unknown",
              volume: volumeForSale,
              pricePerLiter: askingPricePerLiter,
              totalAmount: totalAskingPrice,
              saleId: sale.id,
            }),
          });
          console.log("✓ Sale created email sent successfully");
        }
      } catch (emailError) {
        console.error("Failed to send sale created email:", emailError);
        // Don't throw - emails are nice-to-have
      }
    };

    // Execute email sending in background
    EdgeRuntime.waitUntil(sendSaleCreatedEmail());

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