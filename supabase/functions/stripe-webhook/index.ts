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

      console.log("Payment completed, processing ownership transfer...");

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
        }
        
        console.log("✓ Cask ownership created successfully");
      }

      // Mark cask as unavailable for sale
      const { error: caskUpdateError } = await supabaseService
        .from('casks')
        .update({ available_for_sale: false })
        .eq('id', caskId);

      if (caskUpdateError) {
        console.error("Error updating cask availability:", caskUpdateError);
        // Don't throw - ownership was created successfully
      } else {
        console.log("✓ Cask marked as sold");
      }

      // Create payout records for distillery and platform
      const { error: payoutsError } = await supabaseService
        .from('payouts')
        .insert([
          {
            transaction_id: transactionId,
            recipient_id: transaction.seller_id,
            recipient_type: 'distillery',
            amount: transaction.distillery_fee || transaction.seller_amount,
            fee_type: 'distillery_payout',
            status: 'pending_payout',
            description: `Primary sale payout for ${transaction.cask.spirit_name}`
          },
          {
            transaction_id: transactionId,
            recipient_id: null,
            recipient_type: 'platform',
            amount: transaction.platform_fee,
            fee_type: 'platform_fee',
            status: 'pending_payout',
            description: 'ARIGI platform fee for cask sale'
          }
        ]);

      if (payoutsError) {
        console.error("Error creating payout records:", payoutsError);
        // Don't throw - this can be handled manually
      } else {
        console.log("✓ Payout records created");
      }

      // Send email notification to buyer
      try {
        const { data: buyerProfile } = await supabaseService
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('id', userId)
          .single();

        if (buyerProfile?.email) {
          await supabaseService.functions.invoke('send-transaction-email', {
            body: {
              type: 'purchase_confirmation',
              recipientEmail: buyerProfile.email,
              recipientName: `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim(),
              caskName: transaction.cask.spirit_name || 'Whisky Cask',
              caskNumber: transaction.cask.cask_number || 'N/A',
              distilleryName: transaction.cask.distilleries?.name || 'Unknown',
              volume: transaction.volume_liters,
              pricePerLiter: transaction.price_per_liter,
              totalAmount: transaction.total_amount,
              transactionId: transactionId
            }
          });
          console.log("✓ Email notification sent to buyer");
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't throw - email is nice-to-have
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