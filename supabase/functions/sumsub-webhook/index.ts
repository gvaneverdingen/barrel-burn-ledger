import { createClient } from "npm:@supabase/supabase-js@2";
import { hmacDigest } from "../_shared/sumsub.ts";

// Receives Sumsub status updates and automatically marks buyers verified / rejected.
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("SUMSUB_WEBHOOK_SECRET");
  if (!secret) return new Response("Not configured", { status: 503 });

  const raw = await req.text();
  const given = (req.headers.get("x-payload-digest") || "").toLowerCase();
  const alg = req.headers.get("x-payload-digest-alg") || "HMAC_SHA256_HEX";
  const expected = await hmacDigest(secret, raw, alg);
  if (!given || given !== expected) return new Response("Invalid signature", { status: 401 });

  let evt: any;
  try { evt = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  const userId: string | undefined = evt.externalUserId;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return new Response("ok");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let status: string | null = null;
  if (evt.type === "applicantPending" || evt.type === "applicantCreated") status = "pending";
  if (evt.type === "applicantReviewed") {
    const ans = evt.reviewResult?.reviewAnswer;
    if (ans === "GREEN") status = "verified";
    else if (ans === "RED") status = evt.reviewResult?.reviewRejectType === "RETRY" ? "pending" : "rejected";
  }
  if (!status) return new Response("ok");

  const { data: prev } = await admin.from("profiles").select("verification_status").eq("id", userId).maybeSingle();
  if (!prev || prev.verification_status === status) return new Response("ok");
  // Never downgrade someone an admin has already verified, except on a final rejection
  if (prev.verification_status === "verified" && status === "pending") return new Response("ok");

  await admin.from("profiles").update({ verification_status: status }).eq("id", userId);

  if (status === "verified" || status === "rejected" || evt.reviewResult?.reviewRejectType === "RETRY") {
    const retry = evt.reviewResult?.reviewRejectType === "RETRY";
    await admin.from("notifications").insert({
      user_id: userId,
      type: "kyc",
      title: status === "verified" ? "Identity verified" : "Verification needs attention",
      message: status === "verified"
        ? "Your identity has been verified automatically. Wallet payments are now unlocked."
        : retry
          ? "Sumsub needs a clearer document or photo. Please reopen verification and try again."
          : "Your identity verification was not approved. Contact support@arigi.com for help.",
      link: "/consumer-journey",
      metadata: { provider: "sumsub", applicantId: evt.applicantId, reviewAnswer: evt.reviewResult?.reviewAnswer },
    });
  }
  return new Response("ok");
});
