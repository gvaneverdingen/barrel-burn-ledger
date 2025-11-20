import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteRequest {
  paymentIntentId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { paymentIntentId }: CompleteRequest = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment not successful");
    }

    const saleId = paymentIntent.metadata.sale_id;
    const buyerId = paymentIntent.metadata.buyer_id;
    const sellerId = paymentIntent.metadata.seller_id;

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabaseService
      .from("transactions")
      .select(`
        *,
        cask_sales (
          *,
          cask_ownership (*)
        )
      `)
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (transactionError || !transaction) {
      throw new Error("Transaction not found");
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabaseService
      .from("transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (updateTransactionError) {
      throw new Error("Failed to update transaction");
    }

    // Mark sale as sold
    const { error: updateSaleError } = await supabaseService
      .from("cask_sales")
      .update({ status: "sold" })
      .eq("id", saleId);

    if (updateSaleError) {
      throw new Error("Failed to update sale status");
    }

    // Update seller's ownership (reduce volume)
    const originalOwnership = transaction.cask_sales.cask_ownership;
    const remainingVolume = originalOwnership.volume_liters - transaction.volume_liters;
    const remainingPercentage = originalOwnership.ownership_percentage * (remainingVolume / originalOwnership.volume_liters);

    if (remainingVolume > 0) {
      // Update seller's ownership with reduced volume
      const { error: updateOwnershipError } = await supabaseService
        .from("cask_ownership")
        .update({
          volume_liters: remainingVolume,
          ownership_percentage: remainingPercentage,
        })
        .eq("id", originalOwnership.id);

      if (updateOwnershipError) {
        throw new Error("Failed to update seller ownership");
      }
    } else {
      // Mark seller's ownership as inactive if completely sold
      const { error: deactivateOwnershipError } = await supabaseService
        .from("cask_ownership")
        .update({ is_active: false })
        .eq("id", originalOwnership.id);

      if (deactivateOwnershipError) {
        throw new Error("Failed to deactivate seller ownership");
      }
    }

    // Create new ownership record for buyer
    const buyerOwnershipPercentage = (transaction.volume_liters / originalOwnership.casks.current_volume_liters) * 100;
    
    const { error: createOwnershipError } = await supabaseService
      .from("cask_ownership")
      .insert({
        cask_id: transaction.cask_id,
        owner_id: buyerId,
        volume_liters: transaction.volume_liters,
        ownership_percentage: buyerOwnershipPercentage,
        acquisition_price: transaction.total_amount,
      });

    if (createOwnershipError) {
      throw new Error("Failed to create buyer ownership");
    }

    // Create payout records
    await supabaseService.from("payouts").insert([
      {
        transaction_id: transaction.id,
        recipient_id: sellerId,
        recipient_type: "user",
        amount: transaction.seller_amount,
        fee_type: "seller_payout",
        status: "pending_payout",
        description: `Sale payout for ${transaction.volume_liters}L of cask`,
      },
      {
        transaction_id: transaction.id,
        recipient_id: null,
        recipient_type: "platform",
        amount: transaction.platform_fee,
        fee_type: "platform_fee",
        status: "pending_payout",
        description: "Platform fee for cask sale",
      }
    ]);

    // Send email notifications in the background
    const sendEmailNotifications = async () => {
      try {
        // Get buyer and seller email addresses
        const { data: buyerProfile } = await supabaseService
          .from("profiles")
          .select("email, first_name, last_name")
          .eq("id", buyerId)
          .single();

        const { data: sellerProfile } = await supabaseService
          .from("profiles")
          .select("email, first_name, last_name")
          .eq("id", sellerId)
          .single();

        const { data: caskData } = await supabaseService
          .from("casks")
          .select("spirit_name, cask_number, distilleries(name)")
          .eq("id", transaction.cask_id)
          .single();

        // Send buyer confirmation email
        if (buyerProfile?.email) {
          await fetch("https://vnmmjmxhtbplfkdughxu.supabase.co/functions/v1/send-transaction-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "purchase_confirmation",
              recipientEmail: buyerProfile.email,
              recipientName: `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim(),
              caskName: caskData?.spirit_name || "Whisky Cask",
              caskNumber: caskData?.cask_number || "N/A",
              distilleryName: caskData?.distilleries?.name || "Unknown",
              volume: transaction.volume_liters,
              pricePerLiter: transaction.price_per_liter,
              totalAmount: transaction.total_amount,
              transactionId: transaction.id,
            }),
          });
        }

        // Send seller confirmation email
        if (sellerProfile?.email) {
          await fetch("https://vnmmjmxhtbplfkdughxu.supabase.co/functions/v1/send-transaction-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "sale_confirmation",
              recipientEmail: sellerProfile.email,
              recipientName: `${sellerProfile.first_name || ''} ${sellerProfile.last_name || ''}`.trim(),
              caskName: caskData?.spirit_name || "Whisky Cask",
              caskNumber: caskData?.cask_number || "N/A",
              distilleryName: caskData?.distilleries?.name || "Unknown",
              volume: transaction.volume_liters,
              pricePerLiter: transaction.price_per_liter,
              totalAmount: transaction.seller_amount || transaction.total_amount,
              transactionId: transaction.id,
            }),
          });
        }

        console.log("✓ Email notifications sent successfully");
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError);
        // Don't throw - emails are nice-to-have, not critical
      }
    };

    // Execute email sending in background
    EdgeRuntime.waitUntil(sendEmailNotifications());

    return new Response(
      JSON.stringify({
        success: true,
        message: "Purchase completed successfully",
        transaction_id: transaction.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error completing purchase:", error);
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