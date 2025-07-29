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

      // Log transaction to blockchain
      try {
        console.log("Logging transaction to blockchain...");
        
        const blockchainResponse = await supabaseService.functions.invoke('blockchain-logger', {
          body: {
            caskId: caskId,
            buyerId: userId,
            sellerId: transaction.seller_id,
            transactionType: 'purchase',
            volume: transaction.volume_liters,
            price: transaction.total_amount,
            timestamp: Date.now()
          }
        });

        if (blockchainResponse.error) {
          console.error("Blockchain logging failed:", blockchainResponse.error);
          
          // Mark transaction as completed but with blockchain pending
          await supabaseService
            .from('transactions')
            .update({
              status: 'blockchain_pending',
              completed_at: new Date().toISOString()
            })
            .eq('id', transactionId);
        } else {
          console.log("Transaction successfully logged to blockchain:", blockchainResponse.data);
        }
      } catch (blockchainError) {
        console.error("Error during blockchain logging:", blockchainError);
        
        // Still mark payment as completed even if blockchain fails
        await supabaseService
          .from('transactions')
          .update({
            status: 'blockchain_pending',
            completed_at: new Date().toISOString()
          })
          .eq('id', transactionId);
      }

      console.log("Payment processing completed");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});