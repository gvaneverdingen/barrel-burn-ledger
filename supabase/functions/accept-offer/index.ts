import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  offerId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Fetch the offer details
    const { data: offer, error: offerError } = await supabaseClient
      .from('offers')
      .select(`
        *,
        cask:casks(
          id,
          spirit_name,
          cask_number,
          distillery:distilleries(name)
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
      return new Response(
        JSON.stringify({ error: 'Offer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is the seller
    if (offer.seller_id !== user.id) {
      console.error('User is not the seller:', { offerSeller: offer.seller_id, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Only the seller can accept this offer' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update offer status to accepted
    const { error: updateError } = await supabaseClient
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offerId);

    if (updateError) {
      console.error('Error updating offer:', updateError);
      throw updateError;
    }

    console.log('Offer accepted successfully');

    // Create notification for the buyer
    const notificationTitle = 'Offer Accepted!';
    const notificationMessage = `Your offer for ${offer.cask?.spirit_name} (Cask #${offer.cask?.cask_number}) has been accepted! The seller will contact you to complete the transaction.`;
    
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: offer.buyer_id,
        type: 'offer_accepted',
        title: notificationTitle,
        message: notificationMessage,
        link: `/cask/${offer.cask_id}`,
        metadata: {
          offer_id: offerId,
          cask_id: offer.cask_id,
          seller_id: offer.seller_id,
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification fails
    } else {
      console.log('Notification created for buyer:', offer.buyer_id);
    }

    // TODO: In a full implementation, you might want to:
    // 1. Create a transaction record
    // 2. Initiate a payment process
    // 3. Send email notifications
    // 4. Update cask availability

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Offer accepted successfully',
        offer_id: offerId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in accept-offer function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
    
    return new Response(
      JSON.stringify({ 
        error: isProduction ? 'Internal server error' : errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
