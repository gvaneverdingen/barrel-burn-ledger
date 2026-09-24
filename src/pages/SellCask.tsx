import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SignInPrompt } from "@/components/SignInPrompt";
import { toast } from "sonner";
import { Info, Loader2, Store, CheckCircle, ShieldAlert } from "lucide-react";

interface Owned {
  ownershipId: string;
  volume: number;
  cask: { id: string; spirit_name: string; cask_number: string; nft_token_id: number | null; total_price: number | null };
  listing: { id: string; total_asking_price: number; status: string; contact_email: string | null; contact_phone: string | null } | null;
}

const listingSchema = z.object({
  price: z.number({ invalid_type_error: "Enter a price" }).positive("Price must be above 0").max(100_000_000),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Only digits, spaces, + ( ) -").optional(),
  notes: z.string().trim().max(1000).optional(),
});

function ListForm({ item, userEmail, onDone }: { item: Owned; userEmail: string; onDone: () => void }) {
  const [price, setPrice] = useState(String(item.cask.total_price ?? ""));
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const minted = item.cask.nft_token_id != null;

  const submit = async () => {
    const p = listingSchema.safeParse({ price: Number(price), email, phone: phone || undefined, notes: notes || undefined });
    if (!p.success) return toast.error(p.error.errors[0].message);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("cask_sales").insert({
      ownership_id: item.ownershipId,
      cask_id: item.cask.id,
      seller_id: u.user!.id,
      total_asking_price: p.data.price,
      asking_price_per_liter: Math.round((p.data.price / (item.volume || 1)) * 100) / 100,
      volume_for_sale_liters: item.volume,
      status: "active",
      notes: p.data.notes ?? null,
      contact_email: p.data.email,
      contact_phone: p.data.phone ?? null,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Your cask is now listed on the marketplace");
    onDone();
  };

  return (
    <div className="space-y-3">
      {!minted && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <span>This cask must be recorded on the blockchain before it can be resold. Ask the distillery to record it.</span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`price-${item.cask.id}`}>Asking price (whole cask)</Label>
          <Input id={`price-${item.cask.id}`} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`email-${item.cask.id}`} className="flex items-center gap-1">
            Contact email for buyers
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-xs">Only signed-in ARIGI members can see your contact details on the listing.</TooltipContent></Tooltip></TooltipProvider>
          </Label>
          <Input id={`email-${item.cask.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`phone-${item.cask.id}`}>Contact phone (optional)</Label>
          <Input id={`phone-${item.cask.id}`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`notes-${item.cask.id}`}>Notes for buyers (optional)</Label>
          <Textarea id={`notes-${item.cask.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
        </div>
      </div>
      <Button onClick={submit} disabled={busy || !minted} className="w-full sm:w-auto">
        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Store className="h-4 w-4 mr-2" />}
        {minted ? "List for resale" : "Blockchain record required"}
      </Button>
    </div>
  );
}

function ConfirmSale({ item, onDone }: { item: Owned; onDone: () => void }) {
  const { formatPrice } = useCurrency();
  const [buyer, setBuyer] = useState("");
  const [price, setPrice] = useState(String(item.listing!.total_asking_price));
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    const e = z.string().trim().email().safeParse(buyer);
    if (!e.success) return toast.error("Enter the buyer's ARIGI account email");
    if (!(Number(price) > 0)) return toast.error("Enter the final price");
    if (!window.confirm(`Confirm the sale for ${formatPrice(Number(price))}? The cask will move to the buyer's account and this can't be undone.`)) return;
    setBusy(true);
    const { error } = await (supabase.rpc as any)("confirm_resale_sold", { _sale_id: item.listing!.id, _buyer_email: e.data, _final_price: Number(price) });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Sale confirmed — the cask is now marked as sold");
    onDone();
  };

  const cancel = async () => {
    setBusy(true);
    const { error } = await supabase.from("cask_sales").update({ status: "cancelled" }).eq("id", item.listing!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Listing removed from the marketplace");
    onDone();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Listed at <span className="font-semibold text-foreground">{formatPrice(item.listing!.total_asking_price)}</span> · buyers contact you at {item.listing!.contact_email || "—"}
        {item.listing!.contact_phone ? ` / ${item.listing!.contact_phone}` : ""}
      </p>
      <div className="rounded-md border border-border p-3 space-y-3">
        <p className="text-sm font-medium flex items-center gap-1">
          Agreed a sale with a buyer?
          <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
            <TooltipContent className="max-w-[260px] text-xs">Confirm once the buyer has paid you. The cask moves to their ARIGI account, the listing is marked sold and the sale appears in the cask's ownership history.</TooltipContent></Tooltip></TooltipProvider>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor={`buyer-${item.cask.id}`}>Buyer's ARIGI email</Label><Input id={`buyer-${item.cask.id}`} type="email" value={buyer} onChange={(e) => setBuyer(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor={`final-${item.cask.id}`}>Final price</Label><Input id={`final-${item.cask.id}`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={confirm} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}Confirm sale</Button>
          <Button variant="outline" onClick={cancel} disabled={busy}>Remove listing</Button>
        </div>
      </div>
    </div>
  );
}

export default function SellCask() {
  const { user } = useAuth();
  const [items, setItems] = useState<Owned[] | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: own } = await supabase
      .from("cask_ownership")
      .select("id, volume_liters, cask:casks(id, spirit_name, cask_number, nft_token_id, total_price)")
      .eq("owner_id", user.id)
      .eq("is_active", true);
    const { data: sales } = await supabase
      .from("cask_sales")
      .select("id, cask_id, total_asking_price, status, contact_email, contact_phone")
      .eq("seller_id", user.id)
      .eq("status", "active");
    setItems(((own as any[]) || []).filter((o) => o.cask).map((o) => ({
      ownershipId: o.id,
      volume: Number(o.volume_liters),
      cask: o.cask,
      listing: ((sales as any[]) || []).find((s) => s.cask_id === o.cask.id) || null,
    })));
  };

  useEffect(() => { load(); }, [user]);

  if (!user) return <SignInPrompt title="Sign in to resell a cask" description="Sign in to list casks you own on the marketplace." />;

  return (
    <div className="mobile-container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Resell a Cask</h1>
        <p className="text-muted-foreground">List a whole cask you own, share how buyers can reach you, and confirm the sale when it's agreed.</p>
      </div>
      {!items ? (
        <Skeleton className="h-40 w-full" />
      ) : items.length === 0 ? (
        <Card><CardContent className="p-6 text-center space-y-3">
          <p className="text-muted-foreground">You don't own any casks yet.</p>
          <Button asChild><Link to="/marketplace">Browse the marketplace</Link></Button>
        </CardContent></Card>
      ) : (
        items.map((it) => (
          <Card key={it.ownershipId}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                <Link to={`/cask/${it.cask.id}`} className="hover:underline">{it.cask.spirit_name}</Link>
                {it.listing ? <Badge className="bg-primary/10 text-primary border-primary/20">Listed for resale</Badge> : <Badge variant="outline">Not listed</Badge>}
              </CardTitle>
              <CardDescription>Cask #{it.cask.cask_number} · {it.volume} L</CardDescription>
            </CardHeader>
            <CardContent>
              {it.listing ? <ConfirmSale item={it} onDone={load} /> : <ListForm item={it} userEmail={user.email || ""} onDone={load} />}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
