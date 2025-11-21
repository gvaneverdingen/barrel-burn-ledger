import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

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
      event = await stripe.webhooks.constructEventAsync(
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

      // Mark cask as unavailable after purchase
      const { error: caskUpdateError } = await supabaseService
        .from('casks')
        .update({ available_for_sale: false })
        .eq('id', caskId);

      if (caskUpdateError) {
        console.error("Error updating cask availability:", caskUpdateError);
      } else {
        console.log("Cask marked as unavailable");
      }

      // Create payout records for distillery
      const { error: payoutError } = await supabaseService
        .from('payouts')
        .insert({
          transaction_id: transactionId,
          recipient_id: transaction.seller_id, // The distillery is the seller
          recipient_type: 'distillery',
          amount: transaction.seller_amount || (transaction.total_amount * 0.885), // 88.5% to distillery
          fee_type: 'distillery_fee',
          status: 'pending_payout',
          description: `Primary market sale of cask ${transaction.cask.cask_number}`
        });

      if (payoutError) {
        console.error("Error creating distillery payout:", payoutError);
      } else {
        console.log("Distillery payout record created");
      }

      // Send confirmation emails
      try {
        const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

        // Get buyer profile
        const { data: buyerProfile } = await supabaseService
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .single();

        // Get distillery profile
        const { data: distillery } = await supabaseService
          .from('distilleries')
          .select('name, profile_id')
          .eq('id', transaction.cask.distillery_id)
          .single();

        const { data: distilleryProfile } = distillery ? await supabaseService
          .from('profiles')
          .select('email')
          .eq('id', distillery.profile_id)
          .single() : { data: null };

        // Send buyer confirmation email
        if (buyerProfile?.email) {
          const buyerEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B4513;">Purchase Confirmed!</h1>
              <p>Dear ${buyerProfile.first_name || 'Valued Customer'},</p>
              <p>Your whisky cask purchase has been confirmed!</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Cask Details</h3>
                <p><strong>Spirit Name:</strong> ${transaction.cask.spirit_name}</p>
                <p><strong>Cask Number:</strong> ${transaction.cask.cask_number}</p>
                <p><strong>Volume:</strong> ${transaction.volume_liters}L</p>
                <p><strong>Amount Paid:</strong> $${transaction.total_amount.toFixed(2)}</p>
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
              </div>
              <p>Your cask ownership will be recorded on the blockchain within 24 hours.</p>
              <p>Visit your portfolio to track your investment: <a href="https://your-domain.com/portfolio">View Portfolio</a></p>
              <p>Best regards,<br>The Angel Share Team</p>
            </div>
          `;

          await resend.emails.send({
            from: 'Angel Share <noreply@angelshare.com>',
            to: [buyerProfile.email],
            subject: 'Cask Purchase Confirmed - Angel Share',
            html: buyerEmailHtml,
          });
          console.log("Buyer confirmation email sent");
        }

        // Send distillery notification email
        if (distilleryProfile?.email) {
          const distilleryEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B4513;">Cask Sold!</h1>
              <p>Dear ${distillery?.name},</p>
              <p>One of your casks has been sold on the Angel Share marketplace!</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Sale Details</h3>
                <p><strong>Spirit Name:</strong> ${transaction.cask.spirit_name}</p>
                <p><strong>Cask Number:</strong> ${transaction.cask.cask_number}</p>
                <p><strong>Volume:</strong> ${transaction.volume_liters}L</p>
                <p><strong>Sale Amount:</strong> $${transaction.total_amount.toFixed(2)}</p>
                <p><strong>Your Payout:</strong> $${(transaction.seller_amount || transaction.total_amount * 0.885).toFixed(2)}</p>
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
              </div>
              <p>The payout will be processed according to your payment schedule.</p>
              <p>Best regards,<br>The Angel Share Team</p>
            </div>
          `;

          await resend.emails.send({
            from: 'Angel Share <noreply@angelshare.com>',
            to: [distilleryProfile.email],
            subject: 'Cask Sale Notification - Angel Share',
            html: distilleryEmailHtml,
          });
          console.log("Distillery notification email sent");
        }
      } catch (emailError) {
        console.error("Error sending confirmation emails:", emailError);
        // Don't throw - email failure shouldn't fail the transaction
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