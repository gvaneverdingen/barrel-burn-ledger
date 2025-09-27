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

    // Use existing user instead of creating a new profile
    const { data: existingUsers, error: usersError } = await supabaseServiceRole
      .from("profiles")
      .select("id, email")
      .limit(1);

    if (usersError) {
      console.log("Users fetch error:", usersError);
      throw usersError;
    }

    let profileId;
    if (existingUsers && existingUsers.length > 0) {
      profileId = existingUsers[0].id;
      console.log("Using existing profile:", existingUsers[0].email);
    } else {
      // If no profiles exist, use the auth user ID directly
      profileId = "99e289e8-cf01-4277-bbe2-b99b088a4166";
      console.log("Using auth user ID directly");
    }

    // Create a test distillery specializing in single malt
    const testDistillery = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      name: "Highland Heritage Single Malt Distillery",
      location: "Speyside, Scotland",
      description: "A prestigious Highland distillery specializing in premium single malt whisky. Known for our extensive collection of carefully curated casks offering exceptional investment opportunities.",
      license_number: "SML-2024-001",
      established_year: 1876,
      verified: true,
      website: "https://highland-heritage.com"
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

    // Create 30 single malt casks with varied characteristics
    const testCasks = [];
    
    if (caskTypes && caskTypes.length > 0) {
      // Create 30 single malt whisky casks with realistic variations
      for (let i = 0; i < 30; i++) {
        const caskTypeIndex = i % caskTypes.length;
        const caskType = caskTypes[caskTypeIndex];
        const age = 12 + Math.floor(i / 3); // Ages from 12 to 21 years
        const volume = 190 + (i % 20); // Volume between 190-209 liters
        const abv = 58 + (i % 5); // ABV between 58-62%
        const basePricePerLiter = 400 + (age * 50) + (i % 5) * 100; // Price varies by age and cask
        const totalPrice = Math.round(volume * basePricePerLiter);
        
        testCasks.push({
          id: crypto.randomUUID(),
          distillery_id: distillery.id,
          cask_type_id: caskType.id,
          spirit_name: `Highland Heritage Single Malt ${age} Year`,
          cask_number: `HH-SM-${String(i + 1).padStart(3, '0')}-2024`,
          distillation_date: `${2024 - age}-${String(Math.floor(i / 2.5) % 12 + 1).padStart(2, '0')}-01`,
          expected_maturation_years: age,
          current_volume_liters: volume,
          alcohol_percentage: abv,
          price_per_liter: basePricePerLiter,
          total_price: totalPrice,
          available_for_sale: true,
          warehouse_location: `Highland Warehouse ${Math.floor(i / 10) + 1}`,
          tasting_notes: `Exceptional ${age}-year-old Highland single malt matured in ${caskType.name}. ${getTastingNotes(caskType.name, age)}`,
          blockchain_id: `HH-${String(i + 1).padStart(3, '0')}`,
          blockchain_hash: `0x${i.toString(16).padStart(2, '0')}${'0'.repeat(38)}`
        });
      }
    }

    // Helper function to generate varied tasting notes
    function getTastingNotes(caskTypeName: string, age: number): string {
      const baseNotes = {
        'Bourbon Barrel': 'Rich vanilla and caramel notes with hints of honey and oak.',
        'Sherry Butt': 'Deep fruit flavors with notes of raisins, figs, and warm spices.',
        'Port Wine Cask': 'Luscious berry flavors with hints of chocolate and port wine.',
        'Cognac Barrel': 'Elegant grape notes with subtle spice and oak complexity.',
        'Mizunara Oak': 'Unique sandalwood and incense notes with delicate spice.',
        'Virgin American Oak': 'Bold vanilla and coconut with strong oak tannins.'
      };
      
      const ageNotes = age > 18 ? ' Exceptionally smooth with deep complexity.' : 
                      age > 15 ? ' Well-balanced with mature character.' : 
                      ' Vibrant and spirited with youthful energy.';
      
      return (baseNotes[caskTypeName as keyof typeof baseNotes] || 'Complex and well-rounded with distinctive character.') + ageNotes;
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
      error: (error as Error).message,
      details: error
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});