import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schema
const PurchaseCaskSchema = z.object({
  saleId: z.string().uuid("Invalid sale ID format"),
});

// Sanitize error messages for production
function sanitizeError(error: unknown, isDev: boolean): string {
  if (isDev) {
    return error instanceof Error ? error.message : String(error);
  }
  
  // In production, return generic messages for security
  if (error instanceof Error) {
    // Only expose specific validation errors
    if (error.message.includes("Invalid") || error.message.includes("must be") || error.message.includes("required")) {
      return error.message;
    }
    // Generic messages for internal errors
    if (error.message.includes("not found") || error.message.includes("no longer active")) {
      return "Sale listing not available";
    }
    if (error.message.includes("not authenticated")) {
      return "Authentication required";
    }
    if (error.message.includes("your own")) {
      return "Cannot purchase your own listing";
    }
  }
  return "An error occurred processing your purchase";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const isDev = Deno.env.get("ENVIRONMENT") !== "production";

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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

    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = PurchaseCaskSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      console.error("Validation error:", errors);
      throw new Error(`Validation failed: ${errors}`);
    }

    const { saleId } = validationResult.data;

    // Get sale details with ownership and cask information
    const { data: sale, error: saleError } = await supabaseService
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
      console.error("Sale fetch error:", saleError);
      throw new Error("Sale listing not found or no longer active");
    }

    if (sale.seller_id === user.id) {
      throw new Error("Cannot purchase your own cask");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate platform fee (5%)
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

    // Determine frontend base URL from request origin or environment
    const originHeader = req.headers.get("origin");
    const frontendBaseUrl = (originHeader && originHeader.startsWith("http"))
      ? originHeader
      : (Deno.env.get("FRONTEND_URL") || (isDev ? "http://localhost:5173" : "http://localhost:5173"));
    const normalizedBaseUrl = frontendBaseUrl.replace(/\/$/, "");

    // Create Stripe checkout session for resale purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${sale.cask_ownership.casks.spirit_name}`,
              description: `${sale.volume_for_sale_liters}L cask - ${sale.cask_ownership.casks.distilleries.name}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${normalizedBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${normalizedBaseUrl}/cask/${sale.cask_ownership.cask_id}`,
      metadata: {
        sale_id: saleId,
        buyer_id: user.id,
        seller_id: sale.seller_id,
        cask_id: sale.cask_ownership.cask_id,
        transaction_type: 'purchase',
        caskId: sale.cask_ownership.cask_id,
        userId: user.id,
      },
    });

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseService
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
        distillery_fee: 0,
        seller_amount: sellerAmount / 100,
        transaction_type: "purchase",
        sale_listing_id: saleId,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "pending",
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Transaction creation error:", transactionError);
      throw new Error("Failed to create transaction");
    }

    return new Response(
      JSON.stringify({
        url: session.url,
        transaction_id: transaction.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating purchase:", error);
    const sanitizedError = sanitizeError(error, isDev);
    return new Response(
      JSON.stringify({ error: sanitizedError }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});