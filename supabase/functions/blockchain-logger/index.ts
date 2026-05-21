import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ethers } from "https://esm.sh/ethers@6.13.4?target=deno&no-check";

// Contract ABIs
const CASK_NFT_ABI = [
  "function mintCask(address to, string caskId, address distillery, string spiritName, string caskNumber, uint256 volumeLiters, uint256 alcoholPercentage, uint256 distillationDate, uint8 ageYears, uint8 rarityTier, string caskType, string specialFinish, string region, bool isSingleBarrel, string tokenURI) returns (uint256)",
  "function getTokenIdByCaskId(string caskId) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFromWithPrice(address from, address to, uint256 tokenId, uint256 price)",
  "function setAdvancedSpecs(uint256 tokenId, tuple(string distillerySite, string countryOfOrigin, uint256 fillDate, string originalSpiritType, string caskSizeCategory, uint256 originalVolumeLiters, uint256 currentVolumeLiters, uint256 currentAbv, string woodType, string previousContent, uint8 charLevel, uint8 fillNumber, string bondedWarehouse, string wowgrHolder, uint8 dutyStatus, string provenanceDocHash, bool exists) specs)",
  "event CaskMinted(uint256 indexed tokenId, string caskId, address indexed distillery, address indexed owner, string spiritName, string caskNumber, uint8 rarityTier)"
];

const MARKETPLACE_ABI = [
  "function listCask(uint256 tokenId, uint256 price, bool isPrimarySale)",
  "function purchaseCask(uint256 tokenId) payable",
  "function unlistCask(uint256 tokenId)",
  "function calculateFees(uint256 price, bool isPrimarySale) view returns (uint256 platformFee, uint256 distilleryRoyalty, uint256 sellerAmount)"
];

const AMOY_NETWORK = { chainId: 80002, name: "amoy" };
const FALLBACK_POLYGON_RPC_URLS = [
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  metadata?: any;
}

interface BlockchainResponse {
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: number;
  tokenId?: number;
  contractAddress?: string;
  success: boolean;
  error?: string;
}

function sanitizeRpcUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

async function createPolygonProvider(primaryRpcUrl?: string) {
  const rpcUrls = [primaryRpcUrl, ...FALLBACK_POLYGON_RPC_URLS].filter(
    (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index
  );

  let lastError: Error | null = null;

  for (const rpcUrl of rpcUrls) {
    try {
      const probeResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_chainId",
          params: [],
        }),
      });

      if (!probeResponse.ok) {
        throw new Error(`HTTP ${probeResponse.status}`);
      }

      const probePayload = await probeResponse.json();
      const chainIdHex = probePayload?.result;
      const chainId = typeof chainIdHex === "string" ? Number.parseInt(chainIdHex, 16) : NaN;

      if (chainId !== AMOY_NETWORK.chainId) {
        throw new Error(`Unexpected chain ID ${chainIdHex ?? "unknown"}`);
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl, AMOY_NETWORK);
      const blockNumber = await provider.getBlockNumber();
      console.log("Connected to Polygon Amoy RPC:", sanitizeRpcUrl(rpcUrl), "Block:", blockNumber);
      return provider;
    } catch (error) {
      lastError = error as Error;
      console.warn("Polygon RPC unavailable:", sanitizeRpcUrl(rpcUrl), "-", lastError.message);
    }
  }

  throw new Error(
    lastError
      ? `Unable to connect to Polygon Amoy RPC: ${lastError.message}`
      : "Unable to connect to Polygon Amoy RPC"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Blockchain logger function called");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Support both user JWT auth and service-role auth (for server-to-server calls)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) {
        throw new Error("User not authenticated");
      }
    }

    const transaction: BlockchainTransaction = await req.json();
    
    if (!transaction.caskId || !transaction.buyerId || !transaction.transactionType) {
      throw new Error("Missing required transaction data");
    }

    console.log("Processing blockchain transaction:", transaction.transactionType, "for cask:", transaction.caskId);

    // Execute blockchain transaction on Polygon
    const blockchainResult = await executePolygonTransaction(transaction, supabaseService);
    
    console.log("Blockchain result:", blockchainResult.success ? "SUCCESS" : "FAILED", blockchainResult.transactionHash || blockchainResult.error);

    if (!blockchainResult.success) {
      throw new Error(blockchainResult.error || "Blockchain transaction failed");
    }

    // Log to blockchain_logs table
    const { error: logError } = await supabaseService
      .from('blockchain_logs')
      .insert({
        transaction_id: transaction.transactionId || null,
        cask_id: transaction.caskId,
        blockchain_hash: blockchainResult.transactionHash,
        contract_address: blockchainResult.contractAddress || null,
        token_id: blockchainResult.tokenId || null,
        block_number: blockchainResult.blockNumber || null,
        gas_used: blockchainResult.gasUsed || null,
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

    // Update records based on transaction type
    if (transaction.transactionType === 'mint') {
      const { error: caskUpdateError } = await supabaseService
        .from('casks')
        .update({
          blockchain_hash: blockchainResult.transactionHash,
          nft_token_id: blockchainResult.tokenId ?? null,
          nft_contract_address: blockchainResult.contractAddress ?? null,
          nft_minted_at: new Date().toISOString()
        })
        .eq('id', transaction.caskId);

      if (caskUpdateError) {
        console.error("Error updating cask with NFT details:", caskUpdateError);
      }
    } else if (transaction.transactionType === 'purchase' && transaction.transactionId) {
      const { error: updateError } = await supabaseService
        .from('transactions')
        .update({
          blockchain_transaction_hash: blockchainResult.transactionHash
        })
        .eq('id', transaction.transactionId);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      tokenId: blockchainResult.tokenId,
      contractAddress: blockchainResult.contractAddress,
      gasUsed: blockchainResult.gasUsed,
      message: `${transaction.transactionType} transaction logged to Polygon`
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

async function executePolygonTransaction(
  transaction: BlockchainTransaction,
  supabaseService: any
): Promise<BlockchainResponse> {
  try {
    const polygonRpcUrl = Deno.env.get("POLYGON_RPC_URL");
    const privateKey = Deno.env.get("POLYGON_PRIVATE_KEY");
    const nftContractAddress = Deno.env.get("CASK_NFT_CONTRACT_ADDRESS");
    
    if (!privateKey) return { transactionHash: '', success: false, error: "Missing POLYGON_PRIVATE_KEY" };
    
    const useSmartContracts = !!nftContractAddress;
    console.log("Mode:", useSmartContracts ? "SMART CONTRACT" : "LOGGING ONLY");
    
    const provider = await createPolygonProvider(polygonRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Wallet:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "MATIC");
    
    if (balance === 0n) {
      return { transactionHash: '', success: false, error: "Wallet has no MATIC for gas fees" };
    }
    
    let tx: any;
    let receipt: any;
    let tokenId: number | undefined;
    let contractAddress: string | undefined;
    
    if (useSmartContracts && transaction.transactionType === 'mint') {
      console.log("Minting NFT via smart contract at", nftContractAddress);
      
      const nftContract = new ethers.Contract(nftContractAddress!, CASK_NFT_ABI, wallet);
      
      // Fetch cask data for contract parameters
      const { data: caskData, error: caskError } = await supabaseService
        .from('casks')
        .select('*, cask_types(name)')
        .eq('id', transaction.caskId)
        .single();
      
      if (caskError || !caskData) {
        return { transactionHash: '', success: false, error: `Cask not found: ${caskError?.message}` };
      }
      
      const metadataUri = `ipfs://placeholder/${transaction.caskId}`;
      const distillationDate = new Date(caskData.distillation_date);
      const ageYears = Math.min(255, Math.floor((Date.now() - distillationDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));
      
      // Mint to the wallet address (server-side minting)
      const mintTx = await nftContract.mintCask(
        wallet.address, // mint to platform wallet, can transfer later
        transaction.caskId,
        wallet.address, // distillery address placeholder
        caskData.spirit_name,
        caskData.cask_number,
        Math.floor(caskData.current_volume_liters || transaction.volume),
        Math.floor((caskData.alcohol_percentage || 63.5) * 100),
        Math.floor(distillationDate.getTime() / 1000),
        ageYears,
        Math.min(5, Math.max(1, caskData.rarity_tier || 1)),
        caskData.cask_types?.name || "Unknown",
        caskData.special_finish || "",
        caskData.region || "",
        caskData.is_single_barrel || false,
        metadataUri
      );
      
      receipt = await mintTx.wait();
      tx = mintTx;
      contractAddress = nftContractAddress;
      
      // Parse token ID from CaskMinted event
      const iface = new ethers.Interface(CASK_NFT_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed?.name === 'CaskMinted') {
            tokenId = Number(parsed.args[0]);
            console.log("Minted token ID:", tokenId);
            break;
          }
        } catch {
          // Not our event, skip
        }
      }
      
    } else if (useSmartContracts && transaction.transactionType === 'transfer') {
      console.log("Transferring NFT via smart contract");
      
      const nftContract = new ethers.Contract(nftContractAddress!, CASK_NFT_ABI, wallet);
      tokenId = Number(await nftContract.getTokenIdByCaskId(transaction.caskId));
      
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
      // Fallback: logging-only mode (embeds transaction data on-chain)
      console.log("Logging-only mode (contracts not deployed)");
      
      const gasPrice = await provider.getFeeData();
      const txData = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify({
        caskId: transaction.caskId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId || "system",
        type: transaction.transactionType,
        volume: transaction.volume.toString(),
        price: transaction.price.toString(),
        timestamp: transaction.timestamp
      })));
      
      tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0n,
        data: txData,
        gasLimit: 100000,
        gasPrice: gasPrice.gasPrice || ethers.parseUnits("30", "gwei")
      });
      
      receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction timeout after 60s")), 60000)
        )
      ]);
    }
    
    if (!receipt || receipt.status !== 1) {
      return { transactionHash: tx?.hash || '', success: false, error: "Transaction reverted on-chain" };
    }
    
    console.log("Transaction confirmed. Block:", receipt.blockNumber, "Gas:", receipt.gasUsed.toString());
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: Number(receipt.gasUsed),
      tokenId,
      contractAddress,
      success: true
    };
    
  } catch (error) {
    console.error("Polygon transaction error:", (error as Error).message);
    return {
      transactionHash: '',
      success: false,
      error: (error as Error).message
    };
  }
}
