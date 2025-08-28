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
    console.log("Payment creation started");
    
    // Parse request body first to get user info
    const requestBody = await req.json();
    const { caskId, amount, currency = "usd", caskName, userId, userEmail } = requestBody;
    
    console.log("Request data:", { caskId, amount, currency, caskName, userId, userEmail });

    if (!caskId || !amount || !caskName || !userId || !userEmail) {
      throw new Error("Missing required parameters: caskId, amount, caskName, userId, or userEmail");
    }

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Use user info from request body (works for both regular and Magic wallet users)
    const user = {
      id: userId,
      email: userEmail
    };

    console.log("User authenticated:", user);

    // Get cask details for transaction
    const { data: cask, error: caskError } = await supabaseService
      .from("casks")
      .select("*, distillery:distilleries(profile_id)")
      .eq("id", caskId)
      .single();

    if (caskError || !cask) {
      throw new Error("Cask not found");
    }

    // Calculate fees based on transaction type
    const totalAmount = amount / 100; // Convert to dollars
    const arigiPlatformFee = Math.round(totalAmount * 0.10 * 100) / 100; // 10%
    
    let distilleryFee, sellerAmount, transactionFee;
    
    // Check if this is primary sale (distillery selling) or secondary (investor to investor)
    const isPrimarySale = cask.distillery.profile_id === user.id;
    
    if (isPrimarySale) {
      // Primary market: Distillery → Investor
      distilleryFee = Math.round(totalAmount * 0.885 * 100) / 100; // 88.5% to distillery
      sellerAmount = distilleryFee;
      transactionFee = Math.round(totalAmount * 0.015 * 100) / 100; // 1.5% transaction fee
    } else {
      // Secondary market: Investor → Investor  
      sellerAmount = Math.round(totalAmount * 0.885 * 100) / 100; // 88.5% to seller
      distilleryFee = Math.round(totalAmount * 0.015 * 100) / 100; // 1.5% to distillery
      transactionFee = Math.round(totalAmount * 0.015 * 100) / 100; // 1.5% transaction fee
    }

    const { data: transaction, error: transactionError } = await supabaseService.from("transactions").insert({
      buyer_id: user.id,
      seller_id: isPrimarySale ? cask.distillery.profile_id : user.id, // Set seller appropriately
      cask_id: caskId,
      transaction_type: isPrimarySale ? "primary_purchase" : "secondary_purchase",
      total_amount: totalAmount,
      volume_liters: cask.current_volume_liters || 0,
      price_per_liter: cask.price_per_liter || 0,
      transaction_fee: transactionFee,
      platform_fee: arigiPlatformFee,
      distillery_fee: distilleryFee,
      status: "payment_pending", // Will require manual approval
      seller_amount: sellerAmount,
    }).select().single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      throw transactionError;
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create a one-time payment session
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
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cask/${caskId}`,
      metadata: {
        caskId: caskId,
        userId: user.id,
        transactionId: transaction.id,
      }
    });


    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});