// Verifies a buyer → seller USDC payment on Polygon and completes the resale.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { ethers } from "npm:ethers@6.13.4";

const USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // native USDC (Circle) on Polygon
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const RPCS = ["https://polygon-rpc.com", "https://polygon-bor-rpc.publicnode.com", "https://polygon.drpc.org"];
const Body = z.object({ saleId: z.string().uuid(), txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) });
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function getReceipt(hash: string) {
  const urls = [Deno.env.get("POLYGON_RPC_URL"), ...RPCS].filter(Boolean) as string[];
  for (const url of urls) {
    try {
      const p = new ethers.JsonRpcProvider(url, { chainId: 137, name: "matic" }, { staticNetwork: true });
      const rc = await p.getTransactionReceipt(hash);
      const head = await p.getBlockNumber();
      return { rc, head };
    } catch (_) { /* try next */ }
  }
  throw new Error("Couldn't reach the Polygon network. Please try again in a minute.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Please sign in" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser(auth.slice(7));
    if (!user) return json({ error: "Please sign in" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid payment reference" }, 400);
    const { saleId, txHash } = parsed.data;

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: prof } = await admin.from("profiles").select("verification_status").eq("id", user.id).maybeSingle();
    if (prof?.verification_status !== "verified") return json({ error: "Identity verification (KYC) is required before paying with a wallet" }, 403);

    const { data: sale } = await admin.from("cask_sales")
      .select("id, cask_id, status, reserved_for, reserved_price, seller_wallet").eq("id", saleId).maybeSingle();
    if (!sale || sale.reserved_for !== user.id) return json({ error: "Payment request not found" }, 404);
    if (sale.status !== "active") return json({ error: "This cask has already been sold" }, 409);
    if (!sale.seller_wallet || !sale.reserved_price) return json({ error: "The seller hasn't set up crypto payment" }, 400);

    const { data: used } = await admin.from("transactions").select("id").ilike("blockchain_transaction_hash", txHash).maybeSingle();
    if (used) return json({ error: "This payment has already been used" }, 409);

    const { rc, head } = await getReceipt(txHash);
    if (!rc) return json({ pending: true, message: "Payment not found on Polygon yet — it may still be confirming." }, 202);
    if (rc.status !== 1) return json({ error: "That transaction failed on the blockchain" }, 400);
    if (head - rc.blockNumber < 2) return json({ pending: true, message: "Waiting for network confirmations…" }, 202);

    const required = ethers.parseUnits(Number(sale.reserved_price).toFixed(2), 6);
    const seller = ethers.getAddress(sale.seller_wallet);
    const paid = rc.logs
      .filter((l) => l.address.toLowerCase() === USDC.toLowerCase() && l.topics[0] === TRANSFER_TOPIC && l.topics.length === 3)
      .filter((l) => ethers.getAddress("0x" + l.topics[2].slice(26)) === seller)
      .reduce((sum, l) => sum + BigInt(l.data), 0n);
    if (paid < required) {
      return json({ error: `The payment sent ${ethers.formatUnits(paid, 6)} USDC to the seller, but ${ethers.formatUnits(required, 6)} USDC is due` }, 400);
    }

    const { data: tid, error } = await admin.rpc("complete_resale_crypto", {
      _sale_id: saleId, _buyer: user.id, _tx_hash: txHash, _amount: Number(ethers.formatUnits(paid, 6)),
    });
    if (error) return json({ error: error.message }, 400);
    await admin.from("blockchain_logs").insert({
      transaction_id: tid, cask_id: sale.cask_id, blockchain_hash: txHash, block_number: rc.blockNumber,
      gas_used: Number(rc.gasUsed), contract_address: USDC, transaction_type: "resale_payment",
      metadata: { from: rc.from, to: seller, amountUsdc: ethers.formatUnits(paid, 6), network: "polygon" },
    });
    return json({ ok: true, transactionId: tid });
  } catch (e) {
    console.error("confirm-resale-crypto", e);
    return json({ error: (e as Error).message }, 500);
  }
});
