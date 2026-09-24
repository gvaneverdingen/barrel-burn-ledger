import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Wallet, ExternalLink, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Native USDC (Circle) on Polygon mainnet
export const POLYGON_USDC = "0x3c499c542cEf5E3811e1192ce70d8cC03d5c3359";
const RPC = "https://polygon-bor-rpc.publicnode.com";
const MIN_POL_FOR_GAS = 0.05;

const TRANSAK_KEY = (import.meta.env.VITE_TRANSAK_API_KEY as string | undefined) || "";
const MOONPAY_KEY = (import.meta.env.VITE_MOONPAY_API_KEY as string | undefined) || "";
const RAMP_KEY = (import.meta.env.VITE_RAMP_API_KEY as string | undefined) || "";

async function rpc(method: string, params: unknown[]) {
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result as string;
}

export async function readBalances(address: string) {
  const data = "0x70a08231" + address.toLowerCase().replace("0x", "").padStart(64, "0");
  const [usdcHex, polHex] = await Promise.all([
    rpc("eth_call", [{ to: POLYGON_USDC, data }, "latest"]),
    rpc("eth_getBalance", [address, "latest"]),
  ]);
  return {
    usdc: Number(BigInt(usdcHex || "0x0")) / 1e6,
    pol: Number(BigInt(polHex || "0x0")) / 1e18,
  };
}

interface Provider {
  id: string;
  name: string;
  blurb: string;
  url: (address: string, amount: number) => string;
}

const PROVIDERS: Provider[] = [
  {
    id: "transak",
    name: "Transak",
    blurb: "Card, Apple/Google Pay, SEPA · strong in EU & UK",
    url: (a, amt) =>
      `https://global.transak.com/?${new URLSearchParams({
        ...(TRANSAK_KEY ? { apiKey: TRANSAK_KEY } : {}),
        cryptoCurrencyCode: "USDC",
        network: "polygon",
        walletAddress: a,
        disableWalletAddressForm: "true",
        defaultFiatAmount: String(Math.ceil(amt)),
        defaultFiatCurrency: "USD",
      })}`,
  },
  {
    id: "moonpay",
    name: "MoonPay",
    blurb: "Card, Apple/Google Pay, bank transfer · global",
    url: (a, amt) =>
      `https://buy.moonpay.com/?${new URLSearchParams({
        ...(MOONPAY_KEY ? { apiKey: MOONPAY_KEY } : {}),
        currencyCode: "usdc_polygon",
        walletAddress: a,
        baseCurrencyCode: "usd",
        baseCurrencyAmount: String(Math.ceil(amt)),
      })}`,
  },
  {
    id: "ramp",
    name: "Ramp",
    blurb: "Card, open banking, SEPA · fast in Europe",
    url: (a, amt) =>
      `https://app.ramp.network/?${new URLSearchParams({
        ...(RAMP_KEY ? { hostApiKey: RAMP_KEY } : {}),
        hostAppName: "ARIGI",
        swapAsset: "MATIC_USDC2",
        userAddress: a,
        fiatCurrency: "USD",
        fiatValue: String(Math.ceil(amt)),
      })}`,
  },
];

interface Props {
  requiredUsd: number;
  getAddress: () => Promise<string | null>;
}

export function FundWalletPanel({ requiredUsd, getAddress }: Props) {
  const [address, setAddress] = useState<string | null>(null);
  const [bal, setBal] = useState<{ usdc: number; pol: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const a = address ?? (await getAddress());
      if (!a) return;
      setAddress(a);
      setBal(await readBalances(a));
    } catch (e: any) {
      toast.error(e?.message || "Could not read wallet balance");
    } finally {
      setLoading(false);
    }
  };

  const shortfall = bal ? Math.max(0, requiredUsd - bal.usdc) : requiredUsd;
  const needsGas = bal ? bal.pol < MIN_POL_FOR_GAS : false;
  const ready = bal && shortfall === 0 && !needsGas;

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Wallet className="h-4 w-4 text-primary" /> Your wallet balance
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-xs">
                You pay from your own wallet. It needs enough USDC on Polygon for the cask, plus a little POL (about {MIN_POL_FOR_GAS}) for the network fee. ARIGI never holds your funds.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button size="sm" variant="outline" onClick={check} disabled={loading} className="gap-1">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {bal ? "Refresh" : "Connect & check"}
        </Button>
      </div>

      {bal && address && (
        <div className="text-sm space-y-1">
          <p className="text-xs text-muted-foreground font-mono">{address.slice(0, 6)}…{address.slice(-4)}</p>
          <div className="flex justify-between"><span className="text-muted-foreground">USDC</span><span>{bal.usdc.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {requiredUsd.toLocaleString()} needed</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">POL (network fee)</span><span>{bal.pol.toFixed(3)}</span></div>
        </div>
      )}

      {ready ? (
        <p className="flex items-center gap-2 text-sm text-primary"><CheckCircle className="h-4 w-4" /> Your wallet is funded — you can confirm the purchase.</p>
      ) : (
        <>
          {bal && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {shortfall > 0 ? `Add about ${Math.ceil(shortfall).toLocaleString()} USDC. ` : ""}
              {needsGas ? "Also add a little POL for the network fee (most providers below sell it too)." : ""}
            </p>
          )}
          <p className="text-xs font-medium">Add funds — choose your provider:</p>
          <div className="grid gap-2">
            {PROVIDERS.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                className="h-auto justify-between py-2"
                disabled={!address}
                onClick={() => window.open(p.url(address!, Math.max(shortfall, 1)), "_blank", "noopener,noreferrer")}
              >
                <span className="text-left">
                  <span className="block text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground font-normal">{p.blurb}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </Button>
            ))}
          </div>
          {!address && <p className="text-xs text-muted-foreground">Connect your wallet first so funds go straight to your own address.</p>}
          {address && <p className="text-xs text-muted-foreground">The provider sends USDC directly to your wallet. Come back and press Refresh once it arrives.</p>}
        </>
      )}
    </div>
  );
}
