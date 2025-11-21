import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ethers } from "https://esm.sh/ethers@6.8.0";

// Contract ABIs (simplified - import full ABIs from artifacts in production)
const CASK_NFT_ABI = [
  "function mintCask(address to, string caskId, address distillery, string spiritName, string caskNumber, uint256 volumeLiters, uint256 alcoholPercentage, uint256 distillationDate, string tokenURI) returns (uint256)",
  "function getTokenIdByCaskId(string caskId) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFromWithPrice(address from, address to, uint256 tokenId, uint256 price)"
];

const MARKETPLACE_ABI = [
  "function listCask(uint256 tokenId, uint256 price, bool isPrimarySale)",
  "function purchaseCask(uint256 tokenId) payable",
  "function unlistCask(uint256 tokenId)",
  "function calculateFees(uint256 price, bool isPrimarySale) view returns (uint256 platformFee, uint256 distilleryRoyalty, uint256 sellerAmount)"
];

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
  transactionId?: string;
}

interface BlockchainResponse {
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: number;
  tokenId?: number;
  contractAddress?: string;
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

    // Log to blockchain_logs table
    const { error: logError } = await supabaseService
      .from('blockchain_logs')
      .insert({
        transaction_id: transaction.transactionId || null,
        cask_id: transaction.caskId,
        blockchain_hash: blockchainResult.transactionHash,
        contract_address: blockchainResult.contractAddress,
        token_id: blockchainResult.tokenId,
        block_number: blockchainResult.blockNumber,
        gas_used: blockchainResult.gasUsed,
        transaction_type: transaction.transactionType,
        metadata: {
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
          volume: transaction.volume,
          price: transaction.price,
          timestamp: transaction.timestamp
        }
      });

    if (logError) {
      console.error("Error logging to blockchain_logs:", logError);
    }

    // Update the transaction record with blockchain hash
    if (transaction.transactionType === 'purchase' && transaction.transactionId) {
      const { error: updateError } = await supabaseService
        .from('transactions')
        .update({
          blockchain_transaction_hash: blockchainResult.transactionHash
        })
        .eq('id', transaction.transactionId);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        throw updateError;
      }
    } else if (transaction.transactionType === 'mint') {
      // Update cask with NFT details
      const { error: caskUpdateError } = await supabaseService
        .from('casks')
        .update({
          blockchain_hash: blockchainResult.transactionHash,
          nft_token_id: blockchainResult.tokenId,
          nft_contract_address: blockchainResult.contractAddress,
          nft_minted_at: new Date().toISOString()
        })
        .eq('id', transaction.caskId);

      if (caskUpdateError) {
        console.error("Error updating cask with NFT details:", caskUpdateError);
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
      error: (error as Error).message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Execute actual blockchain transaction on Polygon using smart contracts
async function executePolygonTransaction(transaction: BlockchainTransaction): Promise<BlockchainResponse> {
  try {
    console.log("Connecting to Polygon network...", {
      caskId: transaction.caskId,
      transactionType: transaction.transactionType
    });
    
    // Get environment variables
    const polygonRpcUrl = Deno.env.get("POLYGON_RPC_URL");
    const privateKey = Deno.env.get("POLYGON_PRIVATE_KEY");
    const nftContractAddress = Deno.env.get("CASK_NFT_CONTRACT_ADDRESS");
    const marketplaceAddress = Deno.env.get("MARKETPLACE_CONTRACT_ADDRESS");
    
    if (!polygonRpcUrl) throw new Error("Missing POLYGON_RPC_URL");
    if (!privateKey) throw new Error("Missing POLYGON_PRIVATE_KEY");
    
    // For now, use smart contracts if available, otherwise fall back to logging
    const useSmartContracts = nftContractAddress && marketplaceAddress;
    
    console.log("Smart contracts mode:", useSmartContracts ? "ENABLED" : "LOGGING ONLY");
    console.log("Creating provider with RPC URL:", polygonRpcUrl.substring(0, 50) + "...");
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(polygonRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Wallet address:", wallet.address);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Wallet balance (MATIC):", ethers.formatEther(balance));
    
    if (balance === 0n) {
      console.warn("Wallet has no MATIC for gas fees");
    }
    
    let tx: any;
    let receipt: any;
    let tokenId: number | undefined;
    let contractAddress: string | undefined;
    
    if (useSmartContracts && transaction.transactionType === 'mint') {
      // Use smart contract to mint NFT
      console.log("Minting NFT using smart contract...");
      
      const nftContract = new ethers.Contract(nftContractAddress!, CASK_NFT_ABI, wallet);
      
      // Prepare metadata (in production, this would be IPFS URI)
      const metadataUri = `ipfs://placeholder/${transaction.caskId}`;
      
      // Mint the NFT
      const mintTx = await nftContract.mintCask(
        transaction.buyerId, // to
        transaction.caskId, // caskId
        transaction.sellerId || wallet.address, // distillery
        "Whisky Cask", // spiritName (get from metadata)
        transaction.caskId.substring(0, 8), // caskNumber
        Math.floor(transaction.volume), // volumeLiters
        6350, // alcoholPercentage (63.5% example)
        Math.floor(Date.now() / 1000), // distillationDate
        metadataUri // tokenURI
      );
      
      receipt = await mintTx.wait();
      tx = mintTx;
      
      // Get token ID from event logs
      const mintEvent = receipt.logs.find((log: any) => {
        try {
          return log.topics[0] === ethers.id("CaskMinted(uint256,string,address,address,string,string)");
        } catch {
          return false;
        }
      });
      
      if (mintEvent) {
        tokenId = Number(mintEvent.topics[1]);
        console.log("Minted token ID:", tokenId);
      }
      
      contractAddress = nftContractAddress;
      
    } else if (useSmartContracts && transaction.transactionType === 'transfer') {
      // Use smart contract for transfer (marketplace purchase)
      console.log("Transferring NFT using smart contract...");
      
      const nftContract = new ethers.Contract(nftContractAddress!, CASK_NFT_ABI, wallet);
      
      // Get token ID for cask
      tokenId = Number(await nftContract.getTokenIdByCaskId(transaction.caskId));
      
      // Transfer with price tracking
      const transferTx = await nftContract.safeTransferFromWithPrice(
        transaction.sellerId!,
        transaction.buyerId,
        tokenId,
        ethers.parseEther(transaction.price.toString())
      );
      
      receipt = await transferTx.wait();
      tx = transferTx;
      contractAddress = nftContractAddress;
      
    } else {
      // Fallback to logging-only mode (current implementation)
      console.log("Using logging-only mode (smart contracts not deployed)");
      
      const gasPrice = await provider.getFeeData();
      
      const transactionData = {
        caskId: transaction.caskId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId || "system",
        type: transaction.transactionType,
        volume: transaction.volume.toString(),
        price: transaction.price.toString(),
        timestamp: transaction.timestamp
      };
      
      const txData = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(transactionData)));
      
      tx = await wallet.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther("0"),
        data: txData,
        gasLimit: 100000,
        gasPrice: gasPrice.gasPrice || ethers.parseUnits("30", "gwei")
      });
      
      receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction timeout after 60 seconds")), 60000)
        )
      ]) as ethers.TransactionReceipt;
    }
    
    console.log("Transaction sent to Polygon:", {
      hash: tx.hash,
      to: tx.to,
      gasLimit: tx.gasLimit?.toString()
    });
    
    if (!receipt) {
      throw new Error("Transaction receipt not available");
    }
    
    console.log("Transaction confirmed:", {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });
    
    if (receipt.status !== 1) {
      throw new Error("Transaction failed on blockchain");
    }
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: Number(receipt.gasUsed),
      tokenId,
      contractAddress,
      success: true
    };
    
  } catch (error) {
    console.error("Polygon transaction error:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      caskId: transaction.caskId,
      transactionType: transaction.transactionType
    });
    
    return {
      transactionHash: '',
      success: false
    };
  }
}