import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schema
const ApproveTransactionSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID format"),
  action: z.enum(["approve", "reject"], {
    errorMap: () => ({ message: "Action must be 'approve' or 'reject'" })
  }),
  reason: z.string().max(500, "Reason must be 500 characters or less").optional(),
});

// Sanitize error messages for production
function sanitizeError(error: unknown, isDev: boolean): string {
  if (isDev) {
    return error instanceof Error ? error.message : String(error);
  }
  
  // In production, return generic messages for security
  if (error instanceof Error) {
    // Only expose specific validation errors
    if (error.message.includes("Invalid") || error.message.includes("must be")) {
      return error.message;
    }
    // Generic messages for internal errors
    if (error.message.includes("not found")) {
      return "Resource not found";
    }
    if (error.message.includes("Unauthorized") || error.message.includes("permissions")) {
      return "Unauthorized access";
    }
  }
  return "An error occurred processing your request";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const isDev = Deno.env.get("ENVIRONMENT") !== "production";

  try {
    console.log("Transaction approval function called");

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

    // Get authenticated user and verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Verify user has administrator role
    const { data: isAdmin, error: roleError } = await supabaseService
      .rpc('has_role', { _user_id: user.id, _role: 'administrator' });

    if (roleError) {
      console.error("Role check error:", roleError);
      throw new Error("Failed to verify admin permissions");
    }

    if (!isAdmin) {
      throw new Error("Unauthorized: Administrator role required");
    }

    console.log("Admin authorization verified for user:", user.id);

    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = ApproveTransactionSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      console.error("Validation error:", errors);
      throw new Error(`Validation failed: ${errors}`);
    }

    const { transactionId, action, reason } = validationResult.data;

    console.log(`Processing ${action} for transaction:`, transactionId);

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabaseService
      .from('transactions')
      .select(`
        *,
        cask:casks(*),
        buyer:profiles!buyer_id(*),
        seller:profiles!seller_id(*)
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      console.error("Transaction fetch error:", transactionError);
      throw new Error("Transaction not found");
    }

    if (transaction.status !== 'payment_received_awaiting_approval') {
      throw new Error("Transaction is not in pending approval state");
    }

    if (action === 'reject') {
      // Reject the transaction
      const { error: rejectError } = await supabaseService
        .from('transactions')
        .update({
          status: 'rejected',
          admin_notes: reason || 'Transaction rejected by admin'
        })
        .eq('id', transactionId);

      if (rejectError) {
        console.error("Reject error:", rejectError);
        throw new Error("Failed to reject transaction");
      }

      // TODO: Initiate Stripe refund here
      console.log("Transaction rejected - refund should be processed");

      return new Response(JSON.stringify({
        success: true,
        message: "Transaction rejected successfully",
        transactionId: transactionId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Approve the transaction
    console.log("Approving transaction and processing blockchain logging...");

    // Log to blockchain first
    try {
      const blockchainResponse = await supabaseService.functions.invoke('blockchain-logger', {
        body: {
          caskId: transaction.cask_id,
          buyerId: transaction.buyer_id,
          sellerId: transaction.seller_id,
          transactionType: transaction.transaction_type === 'primary_purchase' ? 'purchase' : 'transfer',
          volume: transaction.volume_liters,
          price: transaction.total_amount,
          timestamp: Date.now()
        }
      });

      if (blockchainResponse.error) {
        console.error("Blockchain logging failed:", blockchainResponse.error);
        throw new Error("Blockchain logging failed");
      }

      console.log("Transaction logged to blockchain:", blockchainResponse.data);

      // Update transaction status to approved
      const { error: approveError } = await supabaseService
        .from('transactions')
        .update({
          status: 'approved',
          blockchain_transaction_hash: blockchainResponse.data.transactionHash,
          admin_notes: reason || 'Transaction approved and logged to blockchain'
        })
        .eq('id', transactionId);

      if (approveError) {
        console.error("Approve error:", approveError);
        throw new Error("Failed to approve transaction");
      }

      // Process payouts based on transaction type
      await processPayouts(supabaseService, transaction);

      console.log("Transaction approved and payouts processed");

      return new Response(JSON.stringify({
        success: true,
        message: "Transaction approved and blockchain logged successfully",
        transactionId: transactionId,
        blockchainHash: blockchainResponse.data.transactionHash
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (blockchainError) {
      console.error("Error during blockchain processing:", blockchainError);
      
      // Mark as approved but blockchain failed
      await supabaseService
        .from('transactions')
        .update({
          status: 'approved_blockchain_failed',
          admin_notes: `Approved but blockchain failed: ${(blockchainError as Error).message}`
        })
        .eq('id', transactionId);

      throw new Error("Transaction approved but blockchain logging failed");
    }

  } catch (error) {
    console.error("Transaction approval error:", error);
    const sanitizedError = sanitizeError(error, isDev);
    return new Response(JSON.stringify({ 
      error: sanitizedError,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});

// Process payouts to distilleries based on transaction type
async function processPayouts(supabaseService: any, transaction: any) {
  console.log("Processing payouts for transaction:", transaction.id);

  // Create payout records for tracking
  const payouts = [];

  if (transaction.transaction_type === 'primary_purchase') {
    // Primary sale: Distillery gets 88.5%
    payouts.push({
      transaction_id: transaction.id,
      recipient_id: transaction.seller_id, // Distillery
      recipient_type: 'distillery',
      amount: transaction.seller_amount,
      fee_type: 'primary_sale_payment',
      status: 'pending_payout',
      description: `Primary sale payment for cask ${transaction.cask.cask_number}`
    });
  } else {
    // Secondary sale: Both seller and distillery get payments
    payouts.push({
      transaction_id: transaction.id,
      recipient_id: transaction.seller_id, // Investor seller
      recipient_type: 'investor',
      amount: transaction.seller_amount,
      fee_type: 'secondary_sale_payment',
      status: 'pending_payout',
      description: `Secondary sale payment for cask ${transaction.cask.cask_number}`
    });

    payouts.push({
      transaction_id: transaction.id,
      recipient_id: transaction.cask.distillery_id, // Original distillery
      recipient_type: 'distillery',
      amount: transaction.distillery_fee,
      fee_type: 'secondary_sale_royalty',
      status: 'pending_payout',
      description: `Royalty payment for cask ${transaction.cask.cask_number} resale`
    });
  }

  // Platform fee for Arigi
  payouts.push({
    transaction_id: transaction.id,
    recipient_id: null, // Arigi platform
    recipient_type: 'platform',
    amount: transaction.platform_fee,
    fee_type: 'platform_fee',
    status: 'collected',
    description: `Platform fee for transaction ${transaction.id}`
  });

  // Insert payout records
  const { error: payoutError } = await supabaseService
    .from('payouts')
    .insert(payouts);

  if (payoutError) {
    console.error("Error creating payout records:", payoutError);
    // Don't throw here as the main transaction should still be approved
  }

  console.log("Payout records created:", payouts.length);
}