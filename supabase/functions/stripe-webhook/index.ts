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
      const metadata = session.metadata || {};
      console.log("Checkout session completed with metadata:", metadata);

      let caskId = metadata.caskId || (metadata as any).cask_id;
      let userId = metadata.userId || (metadata as any).buyer_id;
      let transactionId = (metadata as any).transactionId as string | undefined;
      const saleId = (metadata as any).sale_id as string | undefined;
      const isResale = !!saleId;

      // Resolve transaction either by explicit ID or by Stripe payment_intent
      let transaction: any = null;
      let transactionError: any = null;

      if (transactionId) {
        console.log("Looking up transaction by ID:", transactionId);
        const { data, error } = await supabaseService
          .from('transactions')
          .select('*, cask:casks(*)')
          .eq('id', transactionId)
          .single();
        transaction = data;
        transactionError = error;
      } else if (session.payment_intent) {
        console.log("No transactionId in metadata, looking up by payment_intent:", session.payment_intent);
        const { data, error } = await supabaseService
          .from('transactions')
          .select('*, cask:casks(*)')
          .eq('stripe_payment_intent_id', session.payment_intent as string)
          .single();
        transaction = data;
        transactionError = error;
        if (transaction) {
          transactionId = transaction.id;
        }
      } else {
        console.error("Missing transaction reference in metadata and no payment_intent on session");
        throw new Error("Missing transaction reference");
      }

      if (transactionError || !transaction) {
        console.error("Transaction not found:", transactionError);
        throw new Error("Transaction not found");
      }

      // Ensure we have caskId and userId from transaction if not in metadata
      caskId = caskId || transaction.cask_id;
      userId = userId || transaction.buyer_id;

      if (!caskId || !userId) {
        console.error("Missing caskId or userId after resolving metadata", { caskId, userId });
        throw new Error("Missing required metadata");
      }

      console.log("Processing payment success for transaction:", transactionId);

      // Update transaction status to completed
      const { error: updateError } = await supabaseService
        .from('transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId as string);

      if (updateError) {
        console.error("Error updating transaction status:", updateError);
        throw updateError;
      }

      console.log("Payment completed, creating cask ownership...");

      // For resale, update sale listing and previous ownership
      if (isResale && saleId) {
        console.log("Processing resale transfer for sale:", saleId);
        const { data: sale, error: saleError } = await supabaseService
          .from('cask_sales')
          .select('id, ownership_id, status')
          .eq('id', saleId)
          .single();

        if (saleError || !sale) {
          console.error("Error fetching sale record for resale:", saleError);
          throw new Error("Resale listing not found");
        }

        const { error: saleUpdateError } = await supabaseService
          .from('cask_sales')
          .update({ status: 'sold' })
          .eq('id', saleId);

        if (saleUpdateError) {
          console.error("Error updating sale status:", saleUpdateError);
          throw new Error("Failed to update sale status");
        }

        if (sale.ownership_id) {
          const { error: ownershipDeactivateError } = await supabaseService
            .from('cask_ownership')
            .update({ is_active: false })
            .eq('id', sale.ownership_id);

          if (ownershipDeactivateError) {
            console.error("Error deactivating previous ownership:", ownershipDeactivateError);
            // Not fatal enough to abort whole transaction
          }
        }
      }

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
      const { data: updatedCask, error: caskUpdateError } = await supabaseService
        .from('casks')
        .update({ available_for_sale: false })
        .eq('id', caskId)
        .select();

      if (caskUpdateError) {
        console.error("Error updating cask availability:", caskUpdateError);
        throw new Error(`Failed to update cask availability: ${caskUpdateError.message}`);
      } else {
        console.log("Cask marked as unavailable successfully:", updatedCask);
      }

      // Create payout record
      if (isResale) {
        console.log("Creating payout record for resale transaction");
        const { data: payoutData, error: payoutError } = await supabaseService
          .from('payouts')
          .insert({
            transaction_id: transactionId,
            recipient_id: transaction.seller_id,
            recipient_type: 'user',
            amount: transaction.seller_amount || transaction.total_amount,
            fee_type: 'resale_payout',
            status: 'pending_payout',
            description: `Secondary market sale of cask ${transaction.cask.cask_number}`
          })
          .select();

        if (payoutError) {
          console.error("Error creating resale payout:", payoutError);
          throw new Error(`Failed to create resale payout: ${payoutError.message}`);
        } else {
          console.log("Resale payout record created successfully:", payoutData);
        }
      } else {
        console.log("Creating payout record for primary sale");
        const { data: payoutData, error: payoutError } = await supabaseService
          .from('payouts')
          .insert({
            transaction_id: transactionId,
            recipient_id: transaction.seller_id, // The distillery is the seller
            recipient_type: 'distillery',
            amount: transaction.seller_amount || (transaction.total_amount * 0.885), // 88.5% to distillery
            fee_type: 'distillery_fee',
            status: 'pending_payout',
            description: `Primary market sale of cask ${transaction.cask.cask_number}`
          })
          .select();

        if (payoutError) {
          console.error("Error creating distillery payout:", payoutError);
          throw new Error(`Failed to create distillery payout: ${payoutError.message}`);
        } else {
          console.log("Distillery payout record created successfully:", payoutData);
        }
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

          const buyerEmailResult = await resend.emails.send({
            from: 'Angel Share <onboarding@resend.dev>',
            to: [buyerProfile.email],
            subject: 'Cask Purchase Confirmed - Angel Share',
            html: buyerEmailHtml,
          });
          
          if (buyerEmailResult.error) {
            console.error("Error sending buyer email:", buyerEmailResult.error);
          } else {
            console.log("Buyer confirmation email sent successfully:", buyerEmailResult.data?.id);
          }
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

          const distilleryEmailResult = await resend.emails.send({
            from: 'Angel Share <onboarding@resend.dev>',
            to: [distilleryProfile.email],
            subject: 'Cask Sale Notification - Angel Share',
            html: distilleryEmailHtml,
          });
          
          if (distilleryEmailResult.error) {
            console.error("Error sending distillery email:", distilleryEmailResult.error);
          } else {
            console.log("Distillery notification email sent successfully:", distilleryEmailResult.data?.id);
          }
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