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

    console.log("Starting comprehensive test data population...");

    // Step 1: Fix existing incomplete casks
    console.log("Step 1: Fixing incomplete casks...");
    const { data: incompleteCasks, error: incompleteError } = await supabaseServiceRole
      .from("casks")
      .select("*")
      .or('price_per_liter.is.null,total_price.is.null,current_volume_liters.is.null,alcohol_percentage.is.null');

    if (incompleteError) {
      console.log("Error fetching incomplete casks:", incompleteError);
    } else if (incompleteCasks && incompleteCasks.length > 0) {
      console.log(`Found ${incompleteCasks.length} incomplete casks. Updating...`);
      
      for (const cask of incompleteCasks) {
        const volume = cask.current_volume_liters || (190 + Math.random() * 20);
        const abv = cask.alcohol_percentage || (58 + Math.random() * 5);
        const pricePerLiter = cask.price_per_liter || (400 + Math.random() * 200);
        const totalPrice = cask.total_price || Math.round(volume * pricePerLiter);

        const { error: updateError } = await supabaseServiceRole
          .from("casks")
          .update({
            current_volume_liters: volume,
            alcohol_percentage: abv,
            price_per_liter: pricePerLiter,
            total_price: totalPrice,
            available_for_sale: true
          })
          .eq('id', cask.id);

        if (updateError) {
          console.log(`Error updating cask ${cask.id}:`, updateError);
        }
      }
      console.log(`Updated ${incompleteCasks.length} incomplete casks`);
    } else {
      console.log("No incomplete casks found");
    }

    // Step 2: Get existing cask types
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
      // Create 25 complete casks + 5 incomplete casks for testing
      for (let i = 0; i < 35; i++) {
        const caskTypeIndex = i % caskTypes.length;
        const caskType = caskTypes[caskTypeIndex];
        const age = 12 + Math.floor(i / 3); // Ages from 12 to 21 years
        const volume = 190 + (i % 20); // Volume between 190-209 liters
        const abv = 58 + (i % 5); // ABV between 58-62%
        const basePricePerLiter = 400 + (age * 50) + (i % 5) * 100; // Price varies by age and cask
        const totalPrice = Math.round(volume * basePricePerLiter);
        
        // For the last 5 casks, create incomplete pricing data (should be marked unavailable)
        const isIncomplete = i >= 30;
        
        testCasks.push({
          id: crypto.randomUUID(),
          distillery_id: distillery.id,
          cask_type_id: caskType.id,
          spirit_name: `Highland Heritage Single Malt ${age} Year`,
          cask_number: `HH-SM-${String(i + 1).padStart(3, '0')}-2024`,
          distillation_date: `${2024 - age}-${String(Math.floor(i / 2.5) % 12 + 1).padStart(2, '0')}-01`,
          expected_maturation_years: age,
          current_volume_liters: isIncomplete ? null : volume,
          alcohol_percentage: isIncomplete ? null : abv,
          price_per_liter: isIncomplete ? null : basePricePerLiter,
          total_price: isIncomplete ? null : totalPrice,
          available_for_sale: !isIncomplete,
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

    // Step 3: Create sample cask ownerships for users
    console.log("Step 3: Creating sample cask ownerships...");
    const { data: existingUsers, error: usersListError } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .limit(5);

    if (!usersListError && existingUsers && existingUsers.length > 0 && casks && casks.length > 0) {
      const ownerships = [];
      const numOwnerships = Math.min(10, casks.length, existingUsers.length * 3);
      
      for (let i = 0; i < numOwnerships; i++) {
        const user = existingUsers[i % existingUsers.length];
        const cask = casks[i % casks.length];
        
        ownerships.push({
          cask_id: cask.id,
          owner_id: user.id,
          volume_liters: Math.round((50 + Math.random() * 100) * 100) / 100,
          ownership_percentage: Math.round((10 + Math.random() * 40) * 100) / 100,
          acquisition_price: Math.round((5000 + Math.random() * 20000) * 100) / 100,
          is_active: true
        });
      }

      const { data: ownershipData, error: ownershipError } = await supabaseServiceRole
        .from("cask_ownership")
        .insert(ownerships)
        .select();

      if (ownershipError) {
        console.log("Ownership insert error:", ownershipError);
      } else {
        console.log("Created ownerships:", ownershipData?.length);

        // Step 4: Create some active sales listings
        if (ownershipData && ownershipData.length > 3) {
          console.log("Step 4: Creating sample sales listings...");
          const salesListings = [];
          
          for (let i = 0; i < Math.min(5, ownershipData.length); i++) {
            const ownership = ownershipData[i];
            const volumeForSale = Math.round(ownership.volume_liters * (0.3 + Math.random() * 0.5) * 100) / 100;
            const markupFactor = 1.1 + Math.random() * 0.3; // 10-40% markup
            const pricePerLiter = Math.round((ownership.acquisition_price / ownership.volume_liters) * markupFactor * 100) / 100;
            
            salesListings.push({
              ownership_id: ownership.id,
              seller_id: ownership.owner_id,
              asking_price_per_liter: pricePerLiter,
              total_asking_price: Math.round(pricePerLiter * volumeForSale * 100) / 100,
              volume_for_sale_liters: volumeForSale,
              status: 'active',
              notes: 'High quality investment opportunity'
            });
          }

          const { error: salesError } = await supabaseServiceRole
            .from("cask_sales")
            .insert(salesListings);

          if (salesError) {
            console.log("Sales insert error:", salesError);
          } else {
            console.log("Created sales listings:", salesListings.length);
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Comprehensive test data created and missing data populated",
      incomplete_casks_fixed: incompleteCasks?.length || 0,
      new_distilleries: 1,
      new_casks: casks?.length || 0,
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