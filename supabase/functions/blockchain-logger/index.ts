import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ethers } from "https://esm.sh/ethers@6.8.0";

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

    // Execute blockchain transaction on Polygon
    const blockchainResult = await executePolygonTransaction(transaction);
    
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

// Execute actual blockchain transaction on Polygon
async function executePolygonTransaction(transaction: BlockchainTransaction): Promise<BlockchainResponse> {
  try {
    console.log("Connecting to Polygon network...");
    
    // Get environment variables
    const polygonRpcUrl = Deno.env.get("POLYGON_RPC_URL");
    const privateKey = Deno.env.get("POLYGON_PRIVATE_KEY");
    
    if (!polygonRpcUrl || !privateKey) {
      throw new Error("Missing Polygon configuration");
    }
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(polygonRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Wallet address:", wallet.address);
    
    // Simple contract ABI for logging transactions
    const contractABI = [
      "function logTransaction(string memory caskId, address buyer, string memory txType, uint256 volume, uint256 price) public returns (bytes32)",
      "event TransactionLogged(bytes32 indexed txId, string caskId, address buyer, string txType, uint256 volume, uint256 price, uint256 timestamp)"
    ];
    
    // Deploy a simple logging contract or use existing one
    // For this implementation, we'll create a simple transaction with metadata
    const transactionData = JSON.stringify({
      caskId: transaction.caskId,
      buyerId: transaction.buyerId,
      sellerId: transaction.sellerId,
      type: transaction.transactionType,
      volume: transaction.volume,
      price: transaction.price,
      timestamp: transaction.timestamp
    });
    
    // Create a simple transaction to log the cask transaction
    const tx = await wallet.sendTransaction({
      to: wallet.address, // Self-transaction for logging
      value: ethers.parseEther("0"), // No value transfer
      data: ethers.hexlify(ethers.toUtf8Bytes(transactionData)),
      gasLimit: 100000
    });
    
    console.log("Transaction sent:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (!receipt) {
      throw new Error("Transaction receipt not available");
    }
    
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: Number(receipt.gasUsed),
      success: true
    };
    
  } catch (error) {
    console.error("Polygon transaction error:", error);
    return {
      transactionHash: '',
      success: false
    };
  }
}