import { useEffect, useState } from "react";
import SumsubWebSdk from "@sumsub/websdk-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ScanFace } from "lucide-react";

async function fetchToken(): Promise<{ configured: boolean; token?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke("sumsub-access-token", { body: {} });
  if (error) return { configured: true, error: error.message };
  return data;
}

/** Automatic ID check. Renders nothing when Sumsub isn't set up, so the manual form is used instead. */
export function SumsubVerify({ onReviewed, onAvailability }: { onReviewed?: () => void; onAvailability?: (ok: boolean) => void }) {
  const [state, setState] = useState<"checking" | "off" | "ready" | "open" | "error">("checking");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    fetchToken().then((r) => {
      if (!r.configured) { setState("off"); onAvailability?.(false); return; }
      if (r.error || !r.token) { setState("error"); onAvailability?.(false); return; }
      setToken(r.token); setState("ready"); onAvailability?.(true);
    });
  }, []);

  if (state === "off" || state === "error") return null;
  if (state === "checking") return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Preparing verification…</div>;

  if (state === "ready")
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 p-4 space-y-3">
        <p className="font-medium flex items-center gap-2"><ScanFace className="h-4 w-4 text-primary" /> Instant ID check</p>
        <p className="text-sm text-muted-foreground">Scan your ID and take a quick selfie. Most buyers are verified automatically within minutes, and wallet payment unlocks straight away.</p>
        <Button onClick={() => setState("open")} className="w-full">Start verification</Button>
      </div>
    );

  return (
    <SumsubWebSdk
      accessToken={token}
      expirationHandler={async () => (await fetchToken()).token || ""}
      config={{ lang: "en" }}
      options={{ addViewportTag: false, adaptIframeHeight: true }}
      onMessage={(type: string, payload: any) => {
        if (type === "idCheck.onApplicantStatusChanged" && payload?.reviewStatus === "completed") onReviewed?.();
        if (type === "idCheck.onApplicantSubmitted") onReviewed?.();
      }}
      onError={(e: unknown) => console.error("Sumsub", e)}
    />
  );
}
