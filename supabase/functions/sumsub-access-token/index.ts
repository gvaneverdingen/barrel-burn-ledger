import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sumsubConfigured, sumsubRequest } from "../_shared/sumsub.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!sumsubConfigured()) return json({ configured: false });

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
    if (error || !user) return json({ error: "Not signed in" }, 401);

    const levelName = Deno.env.get("SUMSUB_LEVEL_NAME") || "basic-kyc-level";
    const data = await sumsubRequest("POST", "/resources/accessTokens/sdk", {
      userId: user.id, // externalUserId — used by the webhook to find the profile
      levelName,
      ttlInSecs: 1800,
      applicantIdentifiers: user.email ? { email: user.email } : undefined,
    });
    return json({ configured: true, token: data.token });
  } catch (e) {
    console.error("sumsub-access-token", e);
    return json({ error: (e as Error).message }, 500);
  }
});
