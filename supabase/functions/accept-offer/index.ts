import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  offerId: z.string().uuid(),
});

// Sanitize error messages for production
function sanitizeError(error: unknown, isDev: boolean): string {
  if (isDev) {
    return error instanceof Error ? error.message : String(error);
  }
  
  if (error instanceof Error) {
    if (error.message.includes("Invalid") || error.message.includes("must be") || error.message.includes("required")) {
      return error.message;
    }
    if (error.message.includes("not found")) {
      return "Offer not available";
    }
    if (error.message.includes("not authenticated")) {
      return "Authentication required";
    }
    if (error.message.includes("not the seller")) {
      return "Unauthorized action";
    }
  }
  return "An error occurred processing the offer";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const isDev = Deno.env.get("ENVIRONMENT") !== "production";

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user?.id || !user?.email) {
      throw new Error("User not authenticated");
    }

    // Validate request body
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: validation.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { offerId } = validation.data;

    console.log('Processing offer acceptance:', { offerId, userId: user.id });

    // Fetch the offer details with cask and buyer info
    const { data: offer, error: offerError } = await supabaseService
      .from('offers')
      .select(`
        *,
        cask:casks(
          id,
          spirit_name,
          cask_number,
          current_volume_liters,
          distillery_id,
          distilleries:distilleries(name, location)
        ),
        buyer_profile:profiles!offers_buyer_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error('Error fetching offer:', offerError);
      throw new Error('Offer not found');
    }

    // Verify the user is the seller
    if (offer.seller_id !== user.id) {
      console.error('User is not the seller:', { offerSeller: offer.seller_id, userId: user.id });
      throw new Error('Only the seller can accept this offer');
    }

    // Verify offer is still pending
    if (offer.status !== 'pending') {
      throw new Error(`Offer is no longer pending (status: ${offer.status})`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate fees
    const platformFeePercent = 0.05;
    const distilleryFeePercent = 0.02;
    const totalAmount = offer.offered_total_price;
    const platformFee = totalAmount * platformFeePercent;
    const distilleryFee = totalAmount * distilleryFeePercent;
    const sellerAmount = totalAmount - platformFee - distilleryFee;

    // Check if buyer has Stripe customer
    const buyerEmail = offer.buyer_profile?.email;
    if (!buyerEmail) {
      throw new Error('Buyer email not found');
    }

    const customers = await stripe.customers.list({ email: buyerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Determine frontend base URL
    const originHeader = req.headers.get("origin");
    const frontendBaseUrl = (originHeader && originHeader.startsWith("http"))
      ? originHeader
      : (Deno.env.get("FRONTEND_URL") || (isDev ? "http://localhost:5173" : "http://localhost:5173"));
    const normalizedBaseUrl = frontendBaseUrl.replace(/\/$/, "");

    // Create transaction record FIRST (before checkout session)
    const { data: transaction, error: transactionError } = await supabaseService
      .from("transactions")
      .insert({
        cask_id: offer.cask_id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        volume_liters: offer.volume_liters,
        price_per_liter: offer.offered_price_per_liter,
        total_amount: totalAmount,
        transaction_fee: platformFee,
        platform_fee: platformFee,
        distillery_fee: distilleryFee,
        seller_amount: sellerAmount,
        transaction_type: "offer_purchase",
        sale_listing_id: offer.sale_listing_id,
        status: "pending",
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Transaction creation error:", transactionError);
      throw new Error("Failed to create transaction");
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${offer.cask?.spirit_name}`,
              description: `${offer.volume_liters}L cask - ${offer.cask?.distilleries?.name}`,
            },
            unit_amount: Math.round(totalAmount * 100), // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${normalizedBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${normalizedBaseUrl}/offers`,
      metadata: {
        transactionId: transaction.id,
        offer_id: offerId,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        cask_id: offer.cask_id,
        distillery_id: offer.cask?.distillery_id,
        transaction_type: 'offer_purchase',
        caskId: offer.cask_id,
        userId: offer.buyer_id,
      },
    });

    // Update transaction with payment_intent
    await supabaseService
      .from("transactions")
      .update({ stripe_payment_intent_id: session.payment_intent as string })
      .eq("id", transaction.id);

    // Update offer status to processing_payment
    await supabaseService
      .from('offers')
      .update({ status: 'processing_payment' })
      .eq('id', offerId);

    // Create notification for the buyer
    await supabaseService
      .from('notifications')
      .insert({
        user_id: offer.buyer_id,
        type: 'offer_accepted',
        title: 'Offer Accepted - Payment Required',
        message: `Your offer for ${offer.cask?.spirit_name} (Cask #${offer.cask?.cask_number}) has been accepted! Complete payment to finalize the purchase.`,
        link: `/cask/${offer.cask_id}`,
        metadata: {
          offer_id: offerId,
          cask_id: offer.cask_id,
          seller_id: offer.seller_id,
          transaction_id: transaction.id,
        }
      });

    console.log('Offer acceptance processed, payment session created');

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        transaction_id: transaction.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in accept-offer function:', error);
    const sanitizedError = sanitizeError(error, isDev);
    
    return new Response(
      JSON.stringify({ error: sanitizedError }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
