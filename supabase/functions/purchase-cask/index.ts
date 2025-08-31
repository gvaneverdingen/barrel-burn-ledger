import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseRequest {
  saleId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user?.id || !user?.email) {
      throw new Error("User not authenticated");
    }

    const { saleId }: PurchaseRequest = await req.json();

    // Get sale details with ownership and cask information
    const { data: sale, error: saleError } = await supabaseClient
      .from("cask_sales")
      .select(`
        *,
        cask_ownership (
          *,
          casks (
            *,
            distilleries (name, location),
            cask_types (name, capacity_liters)
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

    // Get seller profile for Stripe account
    const { data: sellerProfile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("id", sale.seller_id)
      .single();

    if (!sellerProfile) {
      throw new Error("Seller profile not found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate platform fee (let's say 5%)
    const platformFeePercent = 0.05;
    const platformFee = Math.round(sale.total_asking_price * platformFeePercent * 100); // in cents
    const totalAmount = Math.round(sale.total_asking_price * 100); // in cents
    const sellerAmount = totalAmount - platformFee;

    // Check if buyer has Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      customer: customerId,
      metadata: {
        sale_id: saleId,
        buyer_id: user.id,
        seller_id: sale.seller_id,
        cask_id: sale.cask_ownership.cask_id,
      },
      description: `Purchase of ${sale.volume_for_sale_liters}L of ${sale.cask_ownership.casks.spirit_name}`,
    });

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from("transactions")
      .insert({
        cask_id: sale.cask_ownership.cask_id,
        buyer_id: user.id,
        seller_id: sale.seller_id,
        volume_liters: sale.volume_for_sale_liters,
        price_per_liter: sale.asking_price_per_liter,
        total_amount: sale.total_asking_price,
        transaction_fee: platformFee / 100,
        platform_fee: platformFee / 100,
        seller_amount: sellerAmount / 100,
        transaction_type: "peer_to_peer_sale",
        sale_listing_id: saleId,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        transaction_id: transaction.id,
        amount: totalAmount,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating purchase:", error);
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