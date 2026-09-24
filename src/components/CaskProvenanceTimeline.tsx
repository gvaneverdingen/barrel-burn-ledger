import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link2, ExternalLink, Info, Factory, ShieldCheck, ArrowRightLeft, Truck, Tag } from "lucide-react";

interface ProvenanceEvent {
  event_at: string;
  event_type: string;
  title: string;
  detail: string | null;
  amount: number | null;
  owner_label: string | null;
  tx_hash: string | null;
  on_chain: boolean;
}

const icons: Record<string, any> = { origin: Factory, mint: ShieldCheck, sale: Tag, resale: ArrowRightLeft, transfer: Truck };

export default function CaskProvenanceTimeline({ caskId }: { caskId: string }) {
  const { formatPrice } = useCurrency();
  const [events, setEvents] = useState<ProvenanceEvent[] | null>(null);

  useEffect(() => {
    (supabase.rpc as any)("get_cask_provenance", { _cask_id: caskId }).then(({ data, error }: any) => {
      if (error) console.error("provenance", error);
      setEvents((data as ProvenanceEvent[]) || []);
    });
  }, [caskId]);

  if (!events) return <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-16 w-full" /></CardContent></Card>;

  const owners = new Set(events.map((e) => e.owner_label).filter((o) => o?.startsWith("Owner"))).size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" /> Ownership History
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-xs">
                Every sale, resale and warehouse transfer of this cask. Owners are shown anonymously. Events marked "On-chain" have a permanent blockchain receipt you can check yourself on Polygonscan.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          {owners === 0 ? "Still with the distillery — no owners yet." : `${owners} owner${owners > 1 ? "s" : ""} since leaving the distillery`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history recorded yet.</p>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-5">
            {events.map((e, i) => {
              const Icon = icons[e.event_type] || Link2;
              return (
                <li key={i} className="ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{e.title}</span>
                    {e.on_chain ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">On-chain</Badge>
                    ) : e.event_type !== "origin" ? (
                      <Badge variant="outline" className="text-xs">Platform record</Badge>
                    ) : null}
                    {e.amount != null && <span className="text-sm font-semibold text-primary ml-auto">{formatPrice(Number(e.amount))}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(e.event_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}{e.detail ? ` · ${e.detail}` : ""}</p>
                  {e.tx_hash && e.on_chain && (
                    <a href={`https://polygonscan.com/tx/${e.tx_hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                      View receipt {e.tx_hash.slice(0, 10)}… <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {e.tx_hash && !e.on_chain && <p className="text-xs text-muted-foreground font-mono mt-1 break-all">Document fingerprint: {e.tx_hash.slice(0, 18)}…</p>}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
