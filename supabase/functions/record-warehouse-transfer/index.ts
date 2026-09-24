// Moves a cask to another warehouse and anchors a tamper-proof receipt on Polygon.
// The receipt is a 0-value transaction from the platform wallet to itself whose data
// carries a SHA-256 fingerprint of the transfer record.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { ethers } from "npm:ethers@6.13.4";

const RPCS = ["https://polygon-rpc.com", "https://polygon-bor-rpc.publicnode.com", "https://polygon.drpc.org"];
const Body = z.object({
  caskId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(500).optional(),
});
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function anchor(fingerprint: string): Promise<{ hash?: string; block?: number; gas?: string; error?: string }> {
  const pk = Deno.env.get("POLYGON_PRIVATE_KEY");
  if (!pk) return { error: "Blockchain wallet not configured" };
  const urls = [Deno.env.get("POLYGON_RPC_URL"), ...RPCS].filter(Boolean) as string[];
  let last = "No RPC available";
  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url, { chainId: 137, name: "matic" }, { staticNetwork: true });
      const wallet = new ethers.Wallet(pk.startsWith("0x") ? pk : "0x" + pk, provider);
      const tx = await wallet.sendTransaction({
        to: wallet.address, value: 0n,
        data: ethers.hexlify(ethers.toUtf8Bytes(`ARIGI:warehouse_move:${fingerprint}`)),
      });
      const rc = await tx.wait(1, 90_000);
      return { hash: tx.hash, block: rc?.blockNumber, gas: rc?.gasUsed?.toString() };
    } catch (e) {
      last = (e as Error).message;
      if (/insufficient funds/i.test(last)) return { error: "The platform wallet needs more POL to pay the network fee" };
    }
  }
  return { error: last };
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
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { caskId, toWarehouseId, transferDate, reason } = parsed.data;

    const { data: allowed } = await userClient.rpc("can_manage_cask", { _cask_id: caskId });
    if (!allowed) return json({ error: "Only the cask's owner, distillery, warehouse or an admin can move it" }, 403);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cask } = await admin.from("casks").select("id, cask_number, nft_token_id").eq("id", caskId).maybeSingle();
    if (!cask) return json({ error: "Cask not found" }, 404);
    // Storage location = destination of the latest move (casks.warehouse_id means the listing holder, not storage)
    const { data: lastMove } = await admin.from("cask_transfers").select("to_warehouse_id")
      .eq("cask_id", caskId).eq("transfer_type", "warehouse_move").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const fromId = lastMove?.to_warehouse_id ?? null;
    if (fromId === toWarehouseId) return json({ error: "The cask is already in that warehouse" }, 400);
    const { data: dest } = await admin.from("warehouses").select("id, name, verified").eq("id", toWarehouseId).maybeSingle();
    if (!dest?.verified) return json({ error: "Choose a verified warehouse" }, 400);

    const { data: transfer, error: insErr } = await admin.from("cask_transfers").insert({
      cask_id: caskId, transfer_type: "warehouse_move", transfer_date: transferDate,
      from_warehouse_id: fromId, to_warehouse_id: toWarehouseId,
      reason: reason || null, created_by: user.id,
    }).select("id, created_at").single();
    if (insErr) throw insErr;
    const { error: upErr } = await admin.from("casks").update({ warehouse_location: dest.name }).eq("id", caskId);
    if (upErr) throw upErr;

    const record = JSON.stringify({ transferId: transfer.id, caskId, cask: cask.cask_number, tokenId: cask.nft_token_id,
      from: fromId, to: toWarehouseId, date: transferDate, by: user.id, at: transfer.created_at });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(record));
    const fingerprint = "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const r = await anchor(fingerprint);
    if (r.hash) {
      await admin.from("cask_transfers").update({ blockchain_tx_hash: r.hash, doc_hash: fingerprint }).eq("id", transfer.id);
      await admin.from("blockchain_logs").insert({
        cask_id: caskId, blockchain_hash: r.hash, transaction_type: "warehouse_transfer",
        block_number: r.block ?? null, gas_used: r.gas ? Number(r.gas) : null,
        metadata: { transferId: transfer.id, fingerprint, record: JSON.parse(record), network: "polygon" },
      });
      return json({ ok: true, transferId: transfer.id, txHash: r.hash });
    }
    await admin.from("cask_transfers").update({ doc_hash: fingerprint }).eq("id", transfer.id);
    console.error("anchor failed", r.error);
    return json({ ok: true, transferId: transfer.id, txHash: null, warning: r.error });
  } catch (e) {
    console.error("record-warehouse-transfer", e);
    return json({ error: (e as Error).message }, 500);
  }
});
