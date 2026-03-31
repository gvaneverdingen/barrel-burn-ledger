import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ethers } from "https://esm.sh/ethers@6.13.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ConfirmSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  blockchainTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});

const RPC_ENDPOINTS = [
  "https://rpc-amoy.polygon.technology",
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org",
];

async function getProvider(): Promise<ethers.JsonRpcProvider> {
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc, { chainId: 80002, name: "amoy" });
      await provider.getBlockNumber();
      return provider;
    } catch (_e) { /* try next */ }
  }
  const customRpc = Deno.env.get("POLYGON_RPC_URL");
  if (customRpc) {
    return new ethers.JsonRpcProvider(customRpc, { chainId: 80002, name: "amoy" });
  }
  throw new Error("All RPC endpoints failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    if (!user?.id) throw new Error("User not authenticated");

    const body = await req.json();
    const parsed = ConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transactionId, blockchainTxHash } = parsed.data;

    // Fetch the pending transaction
    const { data: transaction, error: txError } = await supabaseService
      .from("transactions")
      .select("*, cask:casks(id, cask_number, spirit_name, distillery_id)")
      .eq("id", transactionId)
      .eq("buyer_id", user.id)
      .eq("status", "pending")
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found or already processed");
    }

    // Verify the blockchain transaction
    const provider = await getProvider();
    const receipt = await provider.getTransactionReceipt(blockchainTxHash);

    if (!receipt) {
      // Transaction might still be pending — tell frontend to wait
      return new Response(JSON.stringify({
        confirmed: false,
        message: "Transaction is still pending on the blockchain. Please wait.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (receipt.status !== 1) {
      // Transaction failed on-chain
      await supabaseService
        .from("transactions")
        .update({ status: "failed", admin_notes: `Blockchain tx failed: ${blockchainTxHash}` })
        .eq("id", transactionId);

      return new Response(JSON.stringify({
        confirmed: false,
        error: "Blockchain transaction failed. Your funds have not been charged.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Transaction confirmed on-chain — complete the purchase
    console.log("Blockchain tx confirmed:", blockchainTxHash, "Block:", receipt.blockNumber);

    // Update transaction status
    await supabaseService
      .from("transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        blockchain_transaction_hash: blockchainTxHash,
      })
      .eq("id", transactionId);

    // Handle sale listing update
    if (transaction.sale_listing_id) {
      const { data: sale } = await supabaseService
        .from("cask_sales")
        .select("id, ownership_id")
        .eq("id", transaction.sale_listing_id)
        .single();

      if (sale) {
        await supabaseService
          .from("cask_sales")
          .update({ status: "sold" })
          .eq("id", sale.id);

        if (sale.ownership_id) {
          await supabaseService
            .from("cask_ownership")
            .update({ is_active: false })
            .eq("id", sale.ownership_id);
        }
      }
    }

    // Create new ownership for buyer
    const { data: existingOwnership } = await supabaseService
      .from("cask_ownership")
      .select("id")
      .eq("cask_id", transaction.cask_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!existingOwnership) {
      await supabaseService
        .from("cask_ownership")
        .insert({
          cask_id: transaction.cask_id,
          owner_id: user.id,
          volume_liters: transaction.volume_liters,
          ownership_percentage: 100.0,
          acquisition_price: transaction.total_amount,
          acquired_date: new Date().toISOString(),
        });
    }

    // Mark cask unavailable
    await supabaseService
      .from("casks")
      .update({ available_for_sale: false })
      .eq("id", transaction.cask_id);

    // Create payout record (blockchain payments are settled on-chain, so mark as transferred)
    await supabaseService
      .from("payouts")
      .insert({
        transaction_id: transactionId,
        recipient_id: transaction.seller_id,
        recipient_type: "user",
        amount: transaction.seller_amount || transaction.total_amount,
        fee_type: "blockchain_payout",
        status: "transferred",
        description: `Blockchain payment for cask ${transaction.cask?.cask_number}`,
        processed_at: new Date().toISOString(),
      });

    // Log blockchain event
    await supabaseService
      .from("blockchain_logs")
      .insert({
        transaction_id: transactionId,
        cask_id: transaction.cask_id,
        blockchain_hash: blockchainTxHash,
        transaction_type: "blockchain_purchase",
        block_number: receipt.blockNumber,
        gas_used: Number(receipt.gasUsed),
        metadata: {
          paymentMethod: "blockchain",
          buyer: user.id,
          seller: transaction.seller_id,
        },
      });

    // Send notification to seller
    await supabaseService
      .from("notifications")
      .insert({
        user_id: transaction.seller_id,
        type: "sale_completed",
        title: "Cask Sold via Blockchain!",
        message: `Your cask ${transaction.cask?.spirit_name} has been purchased via blockchain payment.`,
        link: `/portfolio`,
      });

    return new Response(JSON.stringify({
      confirmed: true,
      transactionId,
      blockchainTxHash,
      blockNumber: receipt.blockNumber,
      message: "Purchase confirmed! The cask has been added to your portfolio.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Confirm blockchain purchase error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Confirmation failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});