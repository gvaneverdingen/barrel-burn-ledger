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

    // Create test distilleries first
    const testDistilleries = [
      {
        id: crypto.randomUUID(),
        profile_id: "00000000-0000-0000-0000-000000000000",
        name: "Highland Heritage Distillery",
        location: "Speyside, Scotland",
        description: "Traditional Highland single malt distillery with over 150 years of whisky-making excellence.",
        license_number: "SCT-HHD-1870",
        established_year: 1870,
        verified: true,
        website: "https://highland-heritage.co.uk"
      },
      {
        id: crypto.randomUUID(),
        profile_id: "00000000-0000-0000-0000-000000000000",
        name: "Speyside Crown Distillery", 
        location: "Speyside, Scotland",
        description: "Award-winning distillery producing premium aged single malts with exceptional character.",
        license_number: "SCT-SCD-1925",
        established_year: 1925,
        verified: true,
        website: "https://speyside-crown.com"
      },
      {
        id: crypto.randomUUID(),
        profile_id: "00000000-0000-0000-0000-000000000000",
        name: "Islay Storm Distillery",
        location: "Islay, Scotland", 
        description: "Bold peated whiskies with intense maritime character from the windswept shores of Islay.",
        license_number: "SCT-ISD-1952",
        established_year: 1952,
        verified: true,
        website: "https://islay-storm.co.uk"
      }
    ];

    // Insert distilleries (check if they exist first)
    const { data: existingDistilleries } = await supabaseServiceRole
      .from("distilleries")
      .select("name");

    const existingNames = existingDistilleries?.map(d => d.name) || [];
    const newDistilleries = testDistilleries.filter(d => !existingNames.includes(d.name));

    let distilleries = existingDistilleries || [];
    
    if (newDistilleries.length > 0) {
      const { data: insertedDistilleries, error: distilleryError } = await supabaseServiceRole
        .from("distilleries")
        .insert(newDistilleries)
        .select();

      if (distilleryError) {
        console.log("Distillery error:", distilleryError);
        throw distilleryError;
      }
      
      distilleries = [...distilleries, ...insertedDistilleries];
    } else {
      // Get existing distilleries with full data
      const { data: fullDistilleries } = await supabaseServiceRole
        .from("distilleries")
        .select("*")
        .in("name", testDistilleries.map(d => d.name));
      distilleries = fullDistilleries || [];
    }

    // Get cask types
    const { data: caskTypes, error: caskTypesError } = await supabaseServiceRole
      .from("cask_types")
      .select("*");

    if (caskTypesError) throw caskTypesError;

    // Create test casks with variety
    const testCasks = [
      // Highland Heritage Distillery Casks
      {
        id: crypto.randomUUID(),
        distillery_id: distilleries[0].id,
        cask_type_id: caskTypes.find(ct => ct.name === "American Oak Bourbon Barrel")?.id,
        spirit_name: "Highland Heritage 18 Year Single Malt",
        cask_number: "HH-BB-2006-001",
        distillation_date: "2006-03-15",
        expected_maturation_years: 18,
        current_volume_liters: 185.5,
        alcohol_percentage: 63.2,
        price_per_liter: 450,
        total_price: 83475,
        available_for_sale: true,
        warehouse_location: "Warehouse A, Block 3, Row 12",
        tasting_notes: "Rich honey and vanilla with hints of dried fruit and spice. Long, warming finish with notes of toffee and oak.",
        blockchain_id: "ARIGI-HH-001",
        blockchain_hash: "0x1a2b3c4d5e6f7890abcdef1234567890"
      },
      {
        id: crypto.randomUUID(),
        distillery_id: distilleries[0].id,
        cask_type_id: caskTypes.find(ct => ct.name === "European Oak Sherry Butt")?.id,
        spirit_name: "Highland Heritage 25 Year Reserve",
        cask_number: "HH-SB-1999-007",
        distillation_date: "1999-09-22",
        expected_maturation_years: 25,
        current_volume_liters: 465.2,
        alcohol_percentage: 58.9,
        price_per_liter: 850,
        total_price: 395420,
        available_for_sale: true,
        warehouse_location: "Warehouse B, Block 1, Row 5",
        tasting_notes: "Deep mahogany color with rich Christmas cake, dried fruits, and dark chocolate. Exceptional complexity and length.",
        blockchain_id: "ARIGI-HH-002",
        blockchain_hash: "0x2b3c4d5e6f7890ab1234567890abcdef"
      },
      {
        id: crypto.randomUUID(),
        distillery_id: distilleries[0].id,
        cask_type_id: caskTypes.find(ct => ct.name === "French Oak Cognac Barrel")?.id,
        spirit_name: "Highland Heritage 21 Year Cognac Finish",
        cask_number: "HH-CB-2003-012",
        distillation_date: "2003-06-18",
        expected_maturation_years: 21,
        current_volume_liters: 210.8,
        alcohol_percentage: 61.4,
        price_per_liter: 650,
        total_price: 137020,
        available_for_sale: true,
        warehouse_location: "Warehouse A, Block 2, Row 8",
        tasting_notes: "Elegant cognac influence with grape sweetness, leather, and warming spices. Sophisticated and refined character.",
        blockchain_id: "ARIGI-HH-003",
        blockchain_hash: "0x3c4d5e6f7890ab1234567890abcdef12"
      },
      // Speyside Crown Distillery Casks
      {
        id: crypto.randomUUID(),
        distillery_id: distilleries[1].id,
        cask_type_id: caskTypes.find(ct => ct.name === "Port Wine Cask")?.id,
        spirit_name: "Speyside Crown 16 Year Port Finish",
        cask_number: "SC-PC-2008-045",
        distillation_date: "2008-11-03",
        expected_maturation_years: 16,
        current_volume_liters: 235.7,
        alcohol_percentage: 59.8,
        price_per_liter: 520,
        total_price: 122564,
        available_for_sale: true,
        warehouse_location: "Dunnage Warehouse 1, Section C",
        tasting_notes: "Ruby red influence with berry fruits, dark chocolate, and port wine sweetness. Rich and indulgent profile.",
        blockchain_id: "ARIGI-SC-001",
        blockchain_hash: "0x4d5e6f7890ab1234567890abcdef1234"
      },
      {
        id: crypto.randomUUID(),
        distillery_id: distilleries[1].id,
        cask_type_id: caskTypes.find(ct => ct.name === "Virgin American Oak")?.id,
        spirit_name: "Speyside Crown 12 Year Virgin Oak",
        cask_number: "SC-VO-2012-089",
        distillation_date: "2012-04-27",
        expected_maturation_years: 12,
        current_volume_liters: 195.3,
        alcohol_percentage: 64.1,
        price_per_liter: 380,
        total_price: 74214,
        available_for_sale: true,
        warehouse_location: "Rack Warehouse 2, Level 4",
        tasting_notes: "Intense vanilla and coconut from new oak, balanced with orchard fruits and honey. Bold American oak character.",
        blockchain_id: "ARIGI-SC-002",
        blockchain_hash: "0x5e6f7890ab1234567890abcdef123456"
      },
      // Islay Storm Distillery Casks
      {
        id: crypto.randomUUID(),
        distillery_id: distilleries[2].id,
        cask_type_id: caskTypes.find(ct => ct.name === "American Oak Bourbon Barrel")?.id,
        spirit_name: "Islay Storm 15 Year Peated",
        cask_number: "IS-BB-2009-203",
        distillation_date: "2009-01-19",
        expected_maturation_years: 15,
        current_volume_liters: 188.9,
        alcohol_percentage: 62.7,
        price_per_liter: 580,
        total_price: 109562,
        available_for_sale: true,
        warehouse_location: "Coastal Warehouse 1, Row 15",
        tasting_notes: "Intense peat smoke with maritime salt, seaweed, and medicinal notes. Classic Islay character with bourbon sweetness.",
        blockchain_id: "ARIGI-IS-001",
        blockchain_hash: "0x7890ab1234567890abcdef1234567890"
      },
      {
        id: crypto.randomUUID(),
        distillery_id: distilleries[2].id,
        cask_type_id: caskTypes.find(ct => ct.name === "Japanese Mizunara Oak")?.id,
        spirit_name: "Islay Storm 19 Year Mizunara Limited",
        cask_number: "IS-MZ-2005-012",
        distillation_date: "2005-05-30",
        expected_maturation_years: 19,
        current_volume_liters: 165.4,
        alcohol_percentage: 59.1,
        price_per_liter: 1200,
        total_price: 198480,
        available_for_sale: true,
        warehouse_location: "Special Cask Warehouse, Climate Controlled",
        tasting_notes: "Rare Mizunara oak adds incense and sandalwood to signature Islay smoke. Unique and highly sought-after expression.",
        blockchain_id: "ARIGI-IS-003",
        blockchain_hash: "0x90ab1234567890abcdef123456789012"
      }
    ];

    // Insert test casks (check if they exist first)
    const { data: existingCasks } = await supabaseServiceRole
      .from("casks")
      .select("cask_number");

    const existingCaskNumbers = existingCasks?.map(c => c.cask_number) || [];
    const newCasks = testCasks.filter(c => !existingCaskNumbers.includes(c.cask_number));

    let casks = existingCasks || [];
    
    if (newCasks.length > 0) {
      const { data: insertedCasks, error: casksError } = await supabaseServiceRole
        .from("casks")
        .insert(newCasks)
        .select();

      if (casksError) {
        console.log("Casks error:", casksError);
        throw casksError;
      }
      
      casks = [...casks, ...insertedCasks];
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test data created successfully",
      distilleries: distilleries?.length || 0,
      casks: casks?.length || 0
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