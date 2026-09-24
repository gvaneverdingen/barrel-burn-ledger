import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

type Wh = { id: string; name: string; location: string | null };

export default function WarehouseTransferCard({ caskId, onMoved }: { caskId: string; onMoved?: () => void }) {
  const [warehouses, setWarehouses] = useState<Wh[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("warehouses").select("id, name, location").eq("verified", true).order("name")
      .then(({ data }) => setWarehouses((data as Wh[]) || []));
  }, []);
  const [locationText, setLocationText] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("cask_transfers").select("to_warehouse_id").eq("cask_id", caskId).eq("transfer_type", "warehouse_move")
      .order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => setCurrent((data as any)?.to_warehouse_id ?? null));
    supabase.from("casks").select("warehouse_location").eq("id", caskId).maybeSingle().then(({ data }) => setLocationText((data as any)?.warehouse_location ?? null));
  }, [caskId]);
  const currentName = warehouses.find((w) => w.id === current)?.name;
  const options = warehouses.filter((w) => w.id !== current);

  const submit = async () => {
    if (!to) return toast.error("Choose the destination warehouse");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("record-warehouse-transfer", {
      body: { caskId, toWarehouseId: to, transferDate: date, reason: reason.trim() || undefined },
    });
    setBusy(false);
    const msg = (data as any)?.error || error?.message;
    if (msg) return toast.error(typeof msg === "string" ? msg : "Please check the form");
    if ((data as any)?.txHash) toast.success("Cask moved — blockchain receipt recorded");
    else toast.warning(`Cask moved, but the blockchain receipt couldn't be written yet: ${(data as any)?.warning ?? "network error"}`);
    setCurrent(to); setTo(""); setReason("");
    onMoved?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="h-5 w-5 text-primary" /> Move to another warehouse
          <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" aria-label="About warehouse moves" /></TooltipTrigger>
            <TooltipContent className="max-w-xs">Each move is written to the Polygon blockchain as a permanent, tamper-proof receipt and appears in the cask's ownership history. Only verified bonded warehouses can receive a cask. Moves can't be undone — record a new move instead.</TooltipContent>
          </Tooltip></TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Currently stored at: <span className="text-foreground font-medium">{currentName ?? locationText ?? "Not set"}</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="wt-to">Destination warehouse</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger id="wt-to"><SelectValue placeholder={options.length ? "Choose a warehouse" : "No other verified warehouses"} /></SelectTrigger>
              <SelectContent>{options.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}{w.location ? ` · ${w.location}` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="wt-date">Move date</Label>
            <Input id="wt-date" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="wt-reason">Reason (optional)</Label>
          <Textarea id="wt-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Consolidating stock at the owner's request" />
        </div>
        <Button onClick={submit} disabled={busy || !to}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
          {busy ? "Writing blockchain receipt…" : "Move cask & record on blockchain"}
        </Button>
      </CardContent>
    </Card>
  );
}
