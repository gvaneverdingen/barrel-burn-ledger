import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schema
const CreateCaskSaleSchema = z.object({
  ownershipId: z.string().uuid("Invalid ownership ID format"),
  askingPricePerLiter: z.number().positive("Price per liter must be positive").max(100000, "Price exceeds maximum allowed"),
  volumeForSale: z.number().positive("Volume must be positive").max(10000, "Volume exceeds maximum allowed"),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
  expiresInDays: z.number().int("Expiry days must be an integer").positive("Expiry days must be positive").max(365, "Maximum expiry is 365 days").optional(),
  userId: z.string().uuid("Invalid user ID format").optional(),
  lastGaugingDate: z.string().optional(),
});

// Sanitize error messages for production
function sanitizeError(error: unknown, isDev: boolean): string {
  if (isDev) {
    return error instanceof Error ? error.message : String(error);
  }
  
  // In production, return generic messages for security
  if (error instanceof Error) {
    // Only expose specific validation errors
    if (error.message.includes("Invalid") || error.message.includes("must be") || error.message.includes("required")) {
      return error.message;
    }
    // Generic messages for internal errors
    if (error.message.includes("not found") || error.message.includes("insufficient permissions")) {
      return "Invalid ownership record";
    }
    if (error.message.includes("not authenticated")) {
      return "Authentication required";
    }
    if (error.message.includes("Cannot sell more") || error.message.includes("already an active sale")) {
      return error.message;
    }
  }
  return "An error occurred creating the sale listing";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const isDev = Deno.env.get("ENVIRONMENT") !== "production";

  try {
    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = CreateCaskSaleSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      console.error("Validation error:", errors);
      throw new Error(`Validation failed: ${errors}`);
    }

    const { ownershipId, askingPricePerLiter, volumeForSale, notes, expiresInDays, userId, lastGaugingDate } = validationResult.data;

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
      console.error("Ownership validation error:", ownershipError);
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
      console.error("Sale creation error:", saleError);
      throw new Error("Failed to create sale listing");
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
    const sanitizedError = sanitizeError(error, isDev);
    return new Response(
      JSON.stringify({ error: sanitizedError }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});