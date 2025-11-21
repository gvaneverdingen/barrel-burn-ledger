// Payment processing v3.0 - Added comprehensive error handling and logging
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    console.log("=== PAYMENT CREATION STARTED v3.0 ===");
    
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
    
    // Parse request body for cask info only
    const requestBody = await req.json();
    const { caskId, amount, currency = "usd", caskName } = requestBody;
    
    console.log("Request data received:", { caskId, amount, currency, caskName });

    if (!caskId || !amount || !caskName) {
      const errorMsg = "Missing required parameters: caskId, amount, or caskName";
      console.error("Validation error:", errorMsg);
      throw new Error(errorMsg);
    }

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
      throw new Error(`Cask not found: ${caskError.message}`);
    }
    
    if (!cask) {
      console.error("Cask not found - no data returned");
      throw new Error("Cask not found");
    }
    
    console.log("Cask data retrieved successfully:", { 
      caskId: cask.id, 
      distilleryProfileId: cask.distillery.profile_id,
      distilleryName: cask.distillery.name 
    });

    // Calculate fees based on transaction type
    const totalAmount = amount / 100; // Convert to dollars
    const arigiPlatformFee = Math.round(totalAmount * 0.10 * 100) / 100; // 10%
    
    console.log("Fee calculations:", { totalAmount, arigiPlatformFee });
    
    // For now, all sales are treated as primary sales (distillery to investor)
    // In the future, we'll check ownership table to determine if it's secondary market
    const isPrimarySale = true;
    
    console.log("Sale type analysis:", { 
      isPrimarySale, 
      distilleryProfileId: cask.distillery.profile_id, 
      buyerId: user.id 
    });
    
    // Primary market: Distillery → Investor
    const distilleryFee = Math.round(totalAmount * 0.885 * 100) / 100; // 88.5% to distillery
    const sellerAmount = distilleryFee;
    const transactionFee = Math.round(totalAmount * 0.015 * 100) / 100; // 1.5% transaction fee
    const sellerId = cask.distillery.profile_id; // The distillery owner is the seller

    console.log("Transaction calculations completed:", {
      distilleryFee,
      sellerAmount,
      transactionFee,
      sellerId
    });

    const transactionData = {
      buyer_id: user.id,
      seller_id: sellerId,
      cask_id: caskId,
      transaction_type: "purchase", // Valid enum value: purchase, transfer, or sale
      total_amount: totalAmount,
      volume_liters: cask.current_volume_liters || 0,
      price_per_liter: cask.price_per_liter || 0,
      transaction_fee: transactionFee,
      platform_fee: arigiPlatformFee,
      distillery_fee: distilleryFee,
      status: "pending", // Valid enum value: pending, completed, failed, cancelled
      seller_amount: sellerAmount,
    };

    console.log("Creating transaction with data:", transactionData);

    const { data: transaction, error: transactionError } = await supabaseService
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error("Transaction creation error details:", {
        message: transactionError.message,
        details: transactionError.details,
        hint: transactionError.hint,
        code: transactionError.code
      });
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }

    console.log("Transaction created successfully:", { transactionId: transaction.id });

    // Initialize Stripe
    console.log("Initializing Stripe...");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    console.log("Checking for existing Stripe customer:", user.email);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing Stripe customer:", customerId);
    } else {
      console.log("No existing Stripe customer found");
    }

    // Create a one-time payment session
    console.log("Creating Stripe checkout session...");
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
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cask/${caskId}`,
      metadata: {
        caskId: caskId,
        userId: user.id,
        transactionId: transaction.id,
      }
    });

    console.log("Stripe checkout session created successfully:", { 
      sessionId: session.id, 
      url: session.url 
    });

    console.log("=== PAYMENT CREATION COMPLETED SUCCESSFULLY ===");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("=== PAYMENT CREATION ERROR ===");
    console.error("Error details:", {
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack
    });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});