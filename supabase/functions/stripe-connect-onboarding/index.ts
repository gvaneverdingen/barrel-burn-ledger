import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== STRIPE CONNECT ONBOARDING STARTED ===");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("User authenticated:", user.id);

    // Service client for DB operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get distillery for this user
    const { data: distillery, error: distilleryError } = await supabaseService
      .from("distilleries")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (distilleryError || !distillery) {
      throw new Error("Distillery not found for this user");
    }

    if (!distillery.verified) {
      throw new Error("Distillery must be verified before connecting to Stripe");
    }

    console.log("Distillery found:", distillery.name);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let accountId = distillery.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log("Creating new Stripe Connect account...");
      
      // Get user profile for email
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      const account = await stripe.accounts.create({
        type: "express",
        country: "US", // Default, can be changed during onboarding
        email: profile?.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company",
        company: {
          name: distillery.name,
        },
        metadata: {
          distillery_id: distillery.id,
          user_id: user.id,
        },
      });

      accountId = account.id;

      // Save account ID to database
      await supabaseService
        .from("distilleries")
        .update({ stripe_account_id: accountId })
        .eq("id", distillery.id);

      console.log("Stripe Connect account created:", accountId);
    }

    // Create account link for onboarding
    const { data: body } = await req.json().catch(() => ({ data: {} }));
    const returnUrl = body?.returnUrl || "https://7a41cf81-dfb2-478b-9e01-dcdb07248a90.lovableproject.com/distillery";
    const refreshUrl = body?.refreshUrl || "https://7a41cf81-dfb2-478b-9e01-dcdb07248a90.lovableproject.com/distillery";

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    console.log("Account link created successfully");
    console.log("=== STRIPE CONNECT ONBOARDING COMPLETED ===");

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId: accountId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Stripe Connect onboarding error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
