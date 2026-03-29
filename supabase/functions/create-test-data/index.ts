import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTH CHECK: Only administrators can create test data ===
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin role
    const { data: isAdmin } = await supabaseServiceRole
      .rpc('has_role', { _user_id: user.id, _role: 'administrator' });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Administrator role required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    console.log("Admin authorized, starting test data population...");

    // Get existing cask types
    const { data: caskTypes, error: caskTypesError } = await supabaseServiceRole
      .from("cask_types")
      .select("*");

    if (caskTypesError) {
      throw caskTypesError;
    }

    // Get existing profiles
    const { data: existingUsers, error: usersError } = await supabaseServiceRole
      .from("profiles")
      .select("id, email")
      .limit(5);

    if (usersError) {
      throw usersError;
    }

    const adminUserId = user.id;
    const buyerUserId = existingUsers && existingUsers.length > 1 
      ? existingUsers.find(u => u.id !== adminUserId)?.id || existingUsers[0].id
      : existingUsers?.[0]?.id || adminUserId;

    // Check if admin already has a distillery
    const { data: existingDistillery } = await supabaseServiceRole
      .from("distilleries")
      .select("*")
      .eq("profile_id", adminUserId)
      .maybeSingle();

    let distillery = existingDistillery;

    if (!existingDistillery) {
      const testDistillery = {
        id: crypto.randomUUID(),
        profile_id: adminUserId,
        name: "Speyside Gold Distillery",
        location: "Speyside, Scotland",
        description: "A premium Speyside distillery known for exceptional single malts.",
        license_number: "SPG-2024-001",
        established_year: 1890,
        verified: true,
        website: "https://speysidegold.com"
      };

      const { data: newDistillery, error: distilleryError } = await supabaseServiceRole
        .from("distilleries")
        .insert([testDistillery])
        .select()
        .single();

      if (distilleryError) {
        throw distilleryError;
      }

      distillery = newDistillery;

      await supabaseServiceRole
        .from("user_roles")
        .upsert({ user_id: adminUserId, role: 'distillery' }, { onConflict: 'user_id,role' });
    }

    // Create casks if none exist
    const { data: existingCasks } = await supabaseServiceRole
      .from("casks")
      .select("id")
      .eq("distillery_id", distillery.id)
      .limit(1);

    let casks = [];
    if (!existingCasks || existingCasks.length === 0) {
      const testCasks = [];
      
      if (caskTypes && caskTypes.length > 0) {
        for (let i = 0; i < 10; i++) {
          const caskType = caskTypes[i % caskTypes.length];
          const age = 12 + i;
          const volume = 195 + (i % 10);
          const abv = 58 + (i % 4);
          const pricePerLiter = 500 + (age * 60);
          const totalPrice = Math.round(volume * pricePerLiter);
          
          testCasks.push({
            id: crypto.randomUUID(),
            distillery_id: distillery.id,
            cask_type_id: caskType.id,
            spirit_name: `Speyside Gold ${age} Year`,
            cask_number: `SPG-${String(i + 1).padStart(3, '0')}-2024`,
            distillation_date: `${2024 - age}-06-15`,
            expected_maturation_years: age,
            current_volume_liters: volume,
            alcohol_percentage: abv,
            price_per_liter: pricePerLiter,
            total_price: totalPrice,
            available_for_sale: true,
            warehouse_location: `Warehouse ${Math.floor(i / 3) + 1}`,
            tasting_notes: `Exceptional ${age}-year-old Speyside single malt.`,
            blockchain_id: `SPG-${String(i + 1).padStart(3, '0')}`,
            blockchain_hash: `0xspg${i.toString(16).padStart(2, '0')}${'0'.repeat(36)}`
          });
        }
      }

      const { data: newCasks, error: casksError } = await supabaseServiceRole
        .from("casks")
        .insert(testCasks)
        .select();

      if (casksError) throw casksError;
      casks = newCasks || [];
    } else {
      const { data: allCasks } = await supabaseServiceRole
        .from("casks")
        .select("*")
        .eq("distillery_id", distillery.id);
      casks = allCasks || [];
    }

    // Create test transactions and payouts
    const transactions = [];
    const payouts = [];
    
    for (let i = 0; i < 8; i++) {
      const cask = casks[i % casks.length];
      if (!cask) continue;

      const monthsAgo = Math.floor(i / 2);
      const transactionDate = new Date();
      transactionDate.setMonth(transactionDate.getMonth() - monthsAgo);
      transactionDate.setDate(Math.floor(Math.random() * 28) + 1);

      const volumeSold = 50 + Math.random() * 100;
      const pricePerLiter = cask.price_per_liter || 600;
      const totalAmount = Math.round(volumeSold * pricePerLiter);
      const platformFee = Math.round(totalAmount * 0.05);
      const transactionFee = Math.round(totalAmount * 0.02);
      const distilleryFee = Math.round(totalAmount * 0.03);
      const sellerAmount = totalAmount - platformFee - transactionFee - distilleryFee;

      const transactionId = crypto.randomUUID();
      
      transactions.push({
        id: transactionId,
        cask_id: cask.id,
        buyer_id: buyerUserId,
        seller_id: distillery.profile_id,
        transaction_type: 'primary_sale',
        volume_liters: volumeSold,
        price_per_liter: pricePerLiter,
        total_amount: totalAmount,
        platform_fee: platformFee,
        transaction_fee: transactionFee,
        distillery_fee: distilleryFee,
        seller_amount: sellerAmount,
        status: 'completed',
        completed_at: transactionDate.toISOString(),
        created_at: transactionDate.toISOString()
      });

      payouts.push({
        id: crypto.randomUUID(),
        transaction_id: transactionId,
        recipient_id: distillery.profile_id,
        recipient_type: 'distillery',
        fee_type: 'seller_payout',
        amount: sellerAmount,
        status: i < 5 ? 'completed' : 'pending_payout',
        processed_at: i < 5 ? transactionDate.toISOString() : null,
        created_at: transactionDate.toISOString()
      });
    }

    if (transactions.length > 0) {
      await supabaseServiceRole.from("transactions").insert(transactions);
    }
    if (payouts.length > 0) {
      await supabaseServiceRole.from("payouts").insert(payouts);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test data created successfully",
      data: {
        distillery: distillery.name,
        casks: casks.length,
        transactions: transactions.length,
        payouts: payouts.length
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating test data:", error);
    return new Response(JSON.stringify({ 
      error: "An error occurred processing your request"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
