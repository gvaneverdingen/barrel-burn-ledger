import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Warehouse, CheckCircle, XCircle, Clock, ExternalLink, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WarehouseRow {
  id: string;
  name: string;
  location: string | null;
  country: string | null;
  description: string | null;
  bonded_warehouse_number: string | null;
  warehouse_keeper_license: string | null;
  excise_authority: string | null;
  capacity_casks: number | null;
  established_year: number | null;
  website: string | null;
  verified: boolean | null;
  created_at: string;
  profile_id: string;
}

const WarehouseVerificationManagement = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WarehouseRow | null>(null);
  const [reason, setReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["admin-warehouses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("warehouses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as WarehouseRow[];
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const wh = warehouses?.find((w) => w.id === id);
      if (!wh) throw new Error("Warehouse not found");
      const { error: updErr } = await supabase.from("warehouses").update({ verified: true }).eq("id", id);
      if (updErr) throw updErr;
      const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: wh.profile_id, role: "facilitator" });
      if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
      await supabase.from("notifications").insert({
        user_id: wh.profile_id,
        type: "warehouse_approved",
        title: "Warehouse Approved!",
        message: `Your bonded warehouse "${wh.name}" has been verified. You can now list casks.`,
        link: "/warehouse",
      });
      return wh;
    },
    onSuccess: (wh) => {
      queryClient.invalidateQueries({ queryKey: ["admin-warehouses"] });
      toast.success(`${wh.name} approved!`);
    },
    onError: (e: any) => toast.error(e.message || "Failed to approve"),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const wh = warehouses?.find((w) => w.id === id);
      if (!wh) throw new Error("Warehouse not found");
      const { error } = await supabase.from("warehouses").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: wh.profile_id,
        type: "warehouse_rejected",
        title: "Warehouse Application Rejected",
        message: reason || "Your warehouse application has been rejected. Please contact support.",
        link: "/warehouse/onboarding",
      });
      return wh;
    },
    onSuccess: (wh) => {
      queryClient.invalidateQueries({ queryKey: ["admin-warehouses"] });
      toast.success(`${wh.name} rejected`);
      setRejectOpen(false);
      setSelected(null);
      setReason("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to reject"),
  });

  const filtered = warehouses?.filter((w) =>
    [w.name, w.location, w.country, w.bonded_warehouse_number].some((v) => v?.toLowerCase().includes(search.toLowerCase())),
  );
  const pending = warehouses?.filter((w) => !w.verified).length || 0;
  const verified = warehouses?.filter((w) => w.verified).length || 0;

  if (isLoading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Warehouses</CardTitle><Warehouse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{warehouses?.length || 0}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{pending}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Verified</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{verified}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bonded Warehouse Applications</CardTitle>
          <CardDescription>Review and verify independent warehousing partners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, location, jurisdiction..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Bond Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{w.name}</div>
                      <div className="text-sm text-muted-foreground">{w.location || "No location"}{w.capacity_casks ? ` • ${w.capacity_casks} casks` : ""}</div>
                    </div>
                  </TableCell>
                  <TableCell><div className="text-sm">{w.country || "—"}<div className="text-muted-foreground">{w.excise_authority}</div></div></TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{w.bonded_warehouse_number || "N/A"}</code></TableCell>
                  <TableCell>
                    <Badge variant={w.verified ? "default" : "secondary"}>
                      {w.verified ? <><CheckCircle className="h-3 w-3 mr-1" />Verified</> : <><Clock className="h-3 w-3 mr-1" />Pending</>}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {w.website && <Button variant="ghost" size="sm" onClick={() => window.open(w.website!, "_blank")}><ExternalLink className="h-4 w-4" /></Button>}
                      {!w.verified && (
                        <>
                          <Button size="sm" onClick={() => approve.mutate(w.id)} disabled={approve.isPending}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                          <Button variant="destructive" size="sm" onClick={() => { setSelected(w); setRejectOpen(true); }}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No warehouses found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Warehouse Application</DialogTitle>
            <DialogDescription>Are you sure you want to reject {selected?.name}? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={reject.isPending} onClick={() => selected && reject.mutate({ id: selected.id, reason })}>
              {reject.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseVerificationManagement;