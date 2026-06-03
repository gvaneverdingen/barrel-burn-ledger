import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schema
const CreatePaymentSchema = z.object({
  caskId: z.string().uuid("Invalid cask ID format"),
  currency: z.enum(["usd", "eur", "gbp"], {
    errorMap: () => ({ message: "Currency must be usd, eur, or gbp" })
  }).default("usd"),
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
    if (error.message.includes("not found")) {
      return "Resource not found";
    }
    if (error.message.includes("not authenticated")) {
      return "Authentication required";
    }
  }
  return "An error occurred processing your payment";
}

function getBaseUrl(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      // fall through to referer/default
    }
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // fall through to default
    }
  }

  return "https://barrel-burn-ledger.lovable.app";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const isDev = Deno.env.get("ENVIRONMENT") !== "production";

  try {
    console.log("=== PAYMENT CREATION STARTED ===");
    
    // Get authenticated user from JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("User not authenticated");
    }

    console.log("User authenticated:", { id: user.id, email: user.email });
    
    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = CreatePaymentSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      console.error("Validation error:", errors);
      throw new Error(`Validation failed: ${errors}`);
    }

    const { caskId, amount, currency, caskName } = validationResult.data;
    
    console.log("Request data validated:", { caskId, amount, currency, caskName });

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Supabase service client created successfully");

    // Get cask details for transaction
    console.log("Fetching cask details for ID:", caskId);
    
    const { data: cask, error: caskError } = await supabaseService
      .from("casks")
      .select(`
        *,
        distillery:distilleries!inner(
          id,
          profile_id,
          name
        )
      `)
      .eq("id", caskId)
      .single();

    if (caskError) {
      console.error("Cask query error:", caskError);
      throw new Error("Cask not found");
    }
    
    if (!cask) {
      console.error("Cask not found - no data returned");
      throw new Error("Cask not found");
    }
    
    console.log("Cask data retrieved successfully");

    // Primary sale fee structure: 10% platform + 1.5% transaction = 11.5% total, distillery gets 88.5%
    // (Resale uses 5% platform fee, seller gets 95% — see purchase-cask function)
    const totalAmount = amount / 100; // Convert from cents to dollars
    const platformFeeRate = 0.10;
    const transactionFeeRate = 0.015;
    const distilleryRate = 0.885;
    const arigiPlatformFee = Math.round(totalAmount * platformFeeRate * 100) / 100;
    const transactionFee = Math.round(totalAmount * transactionFeeRate * 100) / 100;
    const distilleryFee = Math.round(totalAmount * distilleryRate * 100) / 100;
    const sellerAmount = distilleryFee;
    const sellerId = cask.distillery.profile_id;

    console.log("Fee calculations:", { totalAmount, arigiPlatformFee, transactionFee, distilleryFee, sellerAmount });

    const transactionData = {
      buyer_id: user.id,
      seller_id: sellerId,
      cask_id: caskId,
      transaction_type: "purchase",
      total_amount: totalAmount,
      volume_liters: cask.current_volume_liters || 0,
      price_per_liter: cask.price_per_liter || 0,
      transaction_fee: transactionFee,
      platform_fee: arigiPlatformFee,
      distillery_fee: distilleryFee,
      status: "pending",
      seller_amount: sellerAmount,
    };

    console.log("Creating transaction");

    const { data: transaction, error: transactionError } = await supabaseService
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error("Transaction creation error:", transactionError);
      throw new Error("Failed to create transaction");
    }

    console.log("Transaction created successfully:", { transactionId: transaction.id });

    // Initialize Stripe
    console.log("Initializing Stripe...");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    console.log("Checking for existing Stripe customer");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing Stripe customer");
    }

    // Create a one-time payment session
    console.log("Creating Stripe checkout session...");
    const baseUrl = getBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: { 
              name: `Whisky Cask Investment: ${caskName}`,
              description: `Purchase of premium whisky cask ${caskName} via ARIGI platform (Subject to manual approval)`
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&transaction_id=${transaction.id}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        caskId: caskId,
        userId: user.id,
        transactionId: transaction.id,
      }
    });

    console.log("Stripe checkout session created successfully");
    console.log("=== PAYMENT CREATION COMPLETED SUCCESSFULLY ===");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("=== PAYMENT CREATION ERROR ===");
    console.error("Error details:", error);
    const sanitizedError = sanitizeError(error, isDev);
    return new Response(JSON.stringify({ error: sanitizedError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});