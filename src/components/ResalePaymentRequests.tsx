import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Info, Loader2, Wallet, QrCode, ShieldAlert, ExternalLink } from "lucide-react";
import { connectWallet, hasInjectedWallet } from "@/lib/walletProvider";

const USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
type Req = { sale_id: string; cask_id: string; spirit_name: string; cask_number: string; price: number; seller_wallet: string };

const pad = (hex: string) => hex.replace(/^0x/, "").padStart(64, "0");
function transferData(to: string, amount: number) {
  const units = BigInt(Math.round(amount * 100)) * 10000n; // 6 decimals, cents precision
  return "0xa9059cbb" + pad(to.toLowerCase()) + pad(units.toString(16));
}
const pendingKey = (id: string) => `arigi_resale_tx_${id}`;

function PayRow({ r, onDone }: { r: Req; onDone: () => void }) {
  const { formatPrice } = useCurrency();
  const [busy, setBusy] = useState<string | null>(null);
  const [tx, setTx] = useState<string>(() => localStorage.getItem(pendingKey(r.sale_id)) || "");

  const confirm = async (hash: string) => {
    setBusy("Confirming payment on Polygon…");
    for (let i = 0; i < 36; i++) {
      const { data, error } = await supabase.functions.invoke("confirm-resale-crypto", { body: { saleId: r.sale_id, txHash: hash } });
      const d: any = data;
      if (d?.ok) {
        localStorage.removeItem(pendingKey(r.sale_id));
        toast.success("Payment confirmed — the cask is now yours");
        setBusy(null); onDone(); return;
      }
      if (!d?.pending) { setBusy(null); toast.error(d?.error || error?.message || "Payment couldn't be confirmed"); return; }
      setBusy(d.message || "Waiting for confirmations…");
      await new Promise((res) => setTimeout(res, 5000));
    }
    setBusy(null);
    toast.message("Still confirming. Press “Check payment” again in a minute.");
  };

  const pay = async (source: "external" | "walletconnect") => {
    try {
      setBusy("Waiting for your wallet…");
      const { provider, address } = await connectWallet(source);
      const hash: string = await provider.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: USDC, data: transferData(r.seller_wallet, Number(r.price)), value: "0x0" }],
      });
      localStorage.setItem(pendingKey(r.sale_id), hash);
      setTx(hash);
      await confirm(hash);
    } catch (e: any) {
      setBusy(null);
      toast.error(e?.code === 4001 ? "Payment cancelled in your wallet" : e?.message || "Wallet payment failed");
    }
  };

  return (
    <div className="rounded-md border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link to={`/cask/${r.cask_id}`} className="font-medium hover:underline">{r.spirit_name}</Link>
        <span className="text-lg font-semibold">{Number(r.price).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC</span>
      </div>
      <p className="text-xs text-muted-foreground break-all">
        Cask #{r.cask_number} · approx. {formatPrice(Number(r.price))} · paid straight to the seller's wallet {r.seller_wallet}
      </p>
      {busy ? (
        <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />{busy}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => pay("external")}><Wallet className="h-4 w-4 mr-2" />Pay with browser wallet</Button>
          <Button variant="outline" onClick={() => pay("walletconnect")}><QrCode className="h-4 w-4 mr-2" />Pay with mobile wallet (QR)</Button>
          {tx && <Button variant="ghost" onClick={() => confirm(tx)}>Check payment</Button>}
        </div>
      )}
      {!hasInjectedWallet() && !busy && <p className="text-xs text-muted-foreground">No browser wallet found. Install MetaMask or use the QR option.</p>}
      {tx && (
        <a className="text-xs text-primary inline-flex items-center gap-1 hover:underline" href={`https://polygonscan.com/tx/${tx}`} target="_blank" rel="noreferrer">
          View your payment on Polygonscan <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

export default function ResalePaymentRequests() {
  const { user } = useAuth();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [kyc, setKyc] = useState<string | null>(null);
  const [manualTx, setManualTx] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase.rpc as any)("get_my_resale_payment_requests");
    setReqs(data || []);
    const { data: p } = await supabase.from("profiles").select("verification_status").eq("id", user.id).maybeSingle();
    setKyc((p as any)?.verification_status ?? null);
  };
  useEffect(() => { load(); }, [user]);

  if (!reqs.length) return null;
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Casks waiting for your payment
          <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" aria-label="How crypto resale works" /></TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">You pay the seller directly in native USDC on Polygon. ARIGI never holds the money. Once the payment is confirmed on the blockchain, the cask moves to your account, and the payment appears in its ownership history as an on-chain receipt. You also need a little POL in your wallet for the network fee.</TooltipContent>
          </Tooltip></TooltipProvider>
        </CardTitle>
        <CardDescription>A seller has agreed a price with you. Pay from your own wallet to complete the purchase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {kyc !== "verified" ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <span>Identity verification (KYC) is required before paying with a wallet. Current status: {kyc || "not started"}.{" "}
              <Link to="/consumer-journey" className="text-primary underline">Complete verification</Link></span>
          </div>
        ) : (
          reqs.map((r) => <PayRow key={r.sale_id} r={r} onDone={load} />)
        )}
        {kyc === "verified" && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Already paid from another device?</summary>
            <div className="mt-2 flex gap-2">
              <Label htmlFor="manual-tx" className="sr-only">Transaction hash</Label>
              <Input id="manual-tx" placeholder="0x… transaction hash" value={manualTx} onChange={(e) => setManualTx(e.target.value.trim())} />
              <Button size="sm" variant="outline" disabled={!/^0x[0-9a-fA-F]{64}$/.test(manualTx)} onClick={() => { localStorage.setItem(pendingKey(reqs[0].sale_id), manualTx); window.location.reload(); }}>Use</Button>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
