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
    console.log("Stripe webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the webhook signature
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new Error("Invalid signature");
    }

    console.log("Processing event:", event.type);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { caskId, userId, transactionId } = session.metadata || {};

      if (!caskId || !userId || !transactionId) {
        console.error("Missing metadata in session:", session.metadata);
        throw new Error("Missing required metadata");
      }

      console.log("Processing payment success for transaction:", transactionId);

      // Get transaction details
      const { data: transaction, error: transactionError } = await supabaseService
        .from('transactions')
        .select('*, cask:casks(*)')
        .eq('id', transactionId)
        .single();

      if (transactionError || !transaction) {
        console.error("Transaction not found:", transactionError);
        throw new Error("Transaction not found");
      }

      // Update transaction status to completed
      const { error: updateError } = await supabaseService
        .from('transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error("Error updating transaction status:", updateError);
        throw updateError;
      }

      console.log("Payment completed, creating cask ownership...");

      // Check if ownership record already exists to avoid duplicates
      const { data: existingOwnership } = await supabaseService
        .from('cask_ownership')
        .select('id')
        .eq('cask_id', caskId)
        .eq('owner_id', userId)
        .single();

      if (existingOwnership) {
        console.log("Ownership record already exists, skipping creation");
      } else {
        // Create cask ownership record immediately after payment
        const { error: ownershipError } = await supabaseService
          .from('cask_ownership')
          .insert({
            cask_id: caskId,
            owner_id: userId,
            volume_liters: transaction.volume_liters,
            ownership_percentage: 100.0,
            acquisition_price: transaction.total_amount,
            acquired_date: new Date().toISOString()
          });

        if (ownershipError) {
          console.error("Error creating cask ownership:", ownershipError);
          throw new Error(`Failed to create cask ownership: ${ownershipError.message}`);
        } else {
          console.log("Cask ownership created successfully for transaction:", transactionId);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});