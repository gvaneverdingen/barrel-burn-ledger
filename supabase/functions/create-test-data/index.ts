import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // First, get existing cask types
    const { data: caskTypes, error: caskTypesError } = await supabaseServiceRole
      .from("cask_types")
      .select("*");

    if (caskTypesError) {
      console.log("Cask types error:", caskTypesError);
      throw caskTypesError;
    }

    console.log("Found cask types:", caskTypes?.length);

    // Create a simple test distillery
    const testDistillery = {
      id: crypto.randomUUID(),
      profile_id: crypto.randomUUID(), // Use a random UUID instead of all zeros
      name: "Highland Test Distillery",
      location: "Speyside, Scotland",
      description: "A test distillery for demonstration purposes.",
      license_number: "TEST-001",
      established_year: 1900,
      verified: true,
      website: "https://test-distillery.com"
    };

    // Insert the distillery
    const { data: distillery, error: distilleryError } = await supabaseServiceRole
      .from("distilleries")
      .insert([testDistillery])
      .select()
      .single();

    if (distilleryError) {
      console.log("Distillery insert error:", distilleryError);
      throw distilleryError;
    }

    console.log("Created distillery:", distillery.name);

    // Create test casks using the available cask types
    const testCasks = [];
    
    if (caskTypes && caskTypes.length > 0) {
      // Create one cask for each cask type
      caskTypes.slice(0, 5).forEach((caskType, index) => {
        testCasks.push({
          id: crypto.randomUUID(),
          distillery_id: distillery.id,
          cask_type_id: caskType.id,
          spirit_name: `Test Whisky ${index + 1}`,
          cask_number: `TEST-${index + 1}-${Date.now()}`,
          distillation_date: `200${index + 5}-01-01`,
          expected_maturation_years: 12 + index * 2,
          current_volume_liters: 200 - index * 10,
          alcohol_percentage: 60 + index,
          price_per_liter: 300 + index * 100,
          total_price: (200 - index * 10) * (300 + index * 100),
          available_for_sale: true,
          warehouse_location: `Test Warehouse ${index + 1}`,
          tasting_notes: `Rich and complex with notes from ${caskType.name}. ${caskType.description}`,
          blockchain_id: `TEST-${index + 1}`,
          blockchain_hash: `0x${index}${'0'.repeat(39)}`
        });
      });
    }

    console.log("Attempting to insert casks:", testCasks.length);

    // Insert the casks
    const { data: casks, error: casksError } = await supabaseServiceRole
      .from("casks")
      .insert(testCasks)
      .select();

    if (casksError) {
      console.log("Casks insert error:", casksError);
      throw casksError;
    }

    console.log("Created casks:", casks?.length);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test data created successfully",
      distilleries: 1,
      casks: casks?.length || 0,
      details: {
        distillery: distillery.name,
        cask_types_used: caskTypes?.length || 0
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating test data:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});