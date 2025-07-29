import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlockchainTransaction {
  caskId: string;
  buyerId: string;
  sellerId?: string;
  transactionType: 'mint' | 'transfer' | 'purchase';
  volume: number;
  price: number;
  timestamp: number;
}

interface BlockchainResponse {
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: number;
  success: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Blockchain logger function called");

    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Parse request body
    const transaction: BlockchainTransaction = await req.json();
    
    if (!transaction.caskId || !transaction.buyerId || !transaction.transactionType) {
      throw new Error("Missing required transaction data");
    }

    console.log("Processing blockchain transaction:", transaction);

    // Simulate blockchain interaction
    // In a real implementation, this would interact with a blockchain network
    const blockchainResult = await simulateBlockchainTransaction(transaction);
    
    console.log("Blockchain transaction result:", blockchainResult);

    if (!blockchainResult.success) {
      throw new Error("Blockchain transaction failed");
    }

    // Update the transaction record with blockchain hash
    if (transaction.transactionType === 'purchase') {
      const { error: updateError } = await supabaseService
        .from('transactions')
        .update({
          blockchain_transaction_hash: blockchainResult.transactionHash,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('cask_id', transaction.caskId)
        .eq('buyer_id', transaction.buyerId)
        .eq('status', 'pending');

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        throw updateError;
      }

      // Update cask ownership
      const { error: ownershipError } = await supabaseService
        .from('cask_ownership')
        .insert({
          cask_id: transaction.caskId,
          owner_id: transaction.buyerId,
          ownership_percentage: 100,
          volume_liters: transaction.volume,
          acquisition_price: transaction.price,
          acquired_date: new Date().toISOString()
        });

      if (ownershipError) {
        console.error("Error creating ownership record:", ownershipError);
        throw ownershipError;
      }

      // Mark cask as unavailable
      const { error: caskUpdateError } = await supabaseService
        .from('casks')
        .update({ available_for_sale: false })
        .eq('id', transaction.caskId);

      if (caskUpdateError) {
        console.error("Error updating cask availability:", caskUpdateError);
        throw caskUpdateError;
      }
    } else if (transaction.transactionType === 'mint') {
      // Update cask with blockchain hash for newly minted casks
      const { error: caskUpdateError } = await supabaseService
        .from('casks')
        .update({
          blockchain_hash: blockchainResult.transactionHash
        })
        .eq('id', transaction.caskId);

      if (caskUpdateError) {
        console.error("Error updating cask blockchain hash:", caskUpdateError);
        throw caskUpdateError;
      }
    }

    console.log("Successfully logged transaction to blockchain");

    return new Response(JSON.stringify({
      success: true,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      message: "Transaction successfully logged to blockchain"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Blockchain logging error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Simulate blockchain transaction
// In production, this would use Web3.js or ethers.js to interact with Ethereum
async function simulateBlockchainTransaction(transaction: BlockchainTransaction): Promise<BlockchainResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Generate a realistic-looking transaction hash
  const hashBytes = new Uint8Array(32);
  crypto.getRandomValues(hashBytes);
  const transactionHash = '0x' + Array.from(hashBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Simulate occasional failures (5% chance)
  const success = Math.random() > 0.05;
  
  if (!success) {
    return {
      transactionHash: '',
      success: false
    };
  }
  
  return {
    transactionHash,
    blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
    gasUsed: Math.floor(Math.random() * 50000) + 21000,
    success: true
  };
}