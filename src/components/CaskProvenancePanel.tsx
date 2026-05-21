import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, History, Droplet, ArrowRightLeft, Paperclip, Upload, X } from "lucide-react";
import { cidError } from "@/lib/ipfs";
import {
  SPIRIT_TYPE_LABELS,
  WOOD_SPECIES_LABELS,
  FILL_GENERATION_LABELS,
  PREVIOUS_CONTENTS_LABELS,
  TOAST_LEVEL_LABELS,
  DUTY_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  TRANSFER_TYPE_OPTIONS,
  computeAngelsShareRate,
} from "@/lib/caskSpecs";

interface CaskRow {
  id: string;
  dsp_code: string | null;
  spirit_type: string | null;
  wood_species: string | null;
  char_level: number | null;
  toast_level: string | null;
  cooperage: string | null;
  cask_fill_generation: string | null;
  previous_contents: string | null;
  original_lpa: number | null;
  duty_status: string | null;
  insurance_valuation: number | null;
  insurance_valuation_at: string | null;
  provenance_doc_hash: string | null;
  wowgr_holder_warehouse_id: string | null;
}

interface Regauge {
  id: string;
  regauge_date: string;
  rla_liters: number;
  bulk_liters: number;
  abv: number;
  notes: string | null;
  document_url: string | null;
  document_filename: string | null;
  document_type: string | null;
}

interface Transfer {
  id: string;
  transfer_date: string;
  transfer_type: string;
  reason: string | null;
  doc_hash: string | null;
  document_url: string | null;
  document_filename: string | null;
  document_type: string | null;
}

interface Props {
  caskId: string;
  /** When true, render add-regauge / add-transfer dialogs. */
  canManage?: boolean;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-sm gap-4">
    <span className="text-muted-foreground">{label}:</span>
    <span className="text-right">{value}</span>
  </div>
);

const DOC_TYPE_OPTIONS = [
  { value: "wowgr", label: "WOWGR Certificate" },
  { value: "cooperage_cert", label: "Cooperage Certificate" },
  { value: "delivery_order", label: "Delivery Order" },
  { value: "distillery_cert", label: "Distillery Certificate" },
  { value: "regauge_report", label: "Regauge Report" },
  { value: "transfer_note", label: "Transfer Note" },
  { value: "other", label: "Other" },
];
const DOC_TYPE_LABELS = Object.fromEntries(DOC_TYPE_OPTIONS.map((o) => [o.value, o.label]));

interface DocumentAttachState {
  file: File | null;
  doc_type: string;
  uploading: boolean;
}

const emptyDoc: DocumentAttachState = { file: null, doc_type: "other", uploading: false };

/** Renders file picker + type selector. Returns selected state via callback. */
const DocumentAttachField = ({
  state,
  onChange,
  label = "Attach Document (optional)",
}: {
  state: DocumentAttachState;
  onChange: (s: DocumentAttachState) => void;
  label?: string;
}) => (
  <div className="space-y-2 col-span-2">
    <Label>{label}</Label>
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f && f.size > 10 * 1024 * 1024) {
            toast.error("File too large (max 10MB)");
            return;
          }
          onChange({ ...state, file: f });
        }}
        className="flex-1"
      />
      <Select value={state.doc_type} onValueChange={(v) => onChange({ ...state, doc_type: v })}>
        <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          {DOC_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    {state.file && (
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Paperclip className="h-3 w-3" />{state.file.name} ({(state.file.size / 1024).toFixed(0)} KB)
        <button type="button" onClick={() => onChange({ ...state, file: null })} className="text-destructive hover:underline">
          <X className="h-3 w-3 inline" /> remove
        </button>
      </p>
    )}
    <p className="text-xs text-muted-foreground">PDFs or images, max 10MB. Stored in the cask documents bucket.</p>
  </div>
);

/** Uploads file to the cask-images bucket under {caskId}/events/. Returns metadata or null. */
async function uploadEventDocument(
  caskId: string,
  state: DocumentAttachState,
): Promise<{ url: string; filename: string; type: string } | null> {
  if (!state.file) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Sign in required to upload documents");
    return null;
  }
  const ext = state.file.name.split(".").pop();
  const path = `${user.id}/events/${caskId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("cask-images")
    .upload(path, state.file, { contentType: state.file.type });
  if (upErr) {
    toast.error(`Upload failed: ${upErr.message}`);
    return null;
  }
  const { data: urlData } = supabase.storage.from("cask-images").getPublicUrl(path);
  return { url: urlData.publicUrl, filename: state.file.name, type: state.doc_type };
}

/** Renders an attached-document chip inside a history row. */
const AttachmentChip = ({
  url,
  filename,
  type,
}: { url: string | null; filename: string | null; type: string | null }) => {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <Paperclip className="h-3 w-3" />
      {type ? DOC_TYPE_LABELS[type] ?? type : "Document"}
      {filename && <span className="text-muted-foreground truncate max-w-[10rem]">— {filename}</span>}
    </a>
  );
};

const CaskProvenancePanel = ({ caskId, canManage = false }: Props) => {
  const [cask, setCask] = useState<CaskRow | null>(null);
  const [regauges, setRegauges] = useState<Regauge[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: caskData }, { data: rg }, { data: tr }] = await Promise.all([
      supabase
        .from("casks")
        .select(
          "id, dsp_code, spirit_type, wood_species, char_level, toast_level, cooperage, cask_fill_generation, previous_contents, original_lpa, duty_status, insurance_valuation, insurance_valuation_at, provenance_doc_hash, wowgr_holder_warehouse_id",
        )
        .eq("id", caskId)
        .maybeSingle(),
      supabase
        .from("cask_regauges")
        .select("id, regauge_date, rla_liters, bulk_liters, abv, notes, document_url, document_filename, document_type")
        .eq("cask_id", caskId)
        .order("regauge_date", { ascending: false }),
      supabase
        .from("cask_transfers")
        .select("id, transfer_date, transfer_type, reason, doc_hash, document_url, document_filename, document_type")
        .eq("cask_id", caskId)
        .order("transfer_date", { ascending: false }),
    ]);
    setCask((caskData as CaskRow) ?? null);
    setRegauges((rg as Regauge[]) ?? []);
    setTransfers((tr as Transfer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caskId]);

  const angelsShareRate = useMemo(
    () => computeAngelsShareRate(regauges, cask?.original_lpa ?? null),
    [regauges, cask?.original_lpa],
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading provenance…</CardContent>
      </Card>
    );
  }

  const hasAnySpec =
    cask &&
    (cask.spirit_type ||
      cask.wood_species ||
      cask.cask_fill_generation ||
      cask.previous_contents ||
      cask.cooperage ||
      cask.char_level ||
      cask.toast_level ||
      cask.dsp_code ||
      cask.original_lpa ||
      cask.insurance_valuation ||
      cask.provenance_doc_hash);

  return (
    <div className="space-y-6">
      {hasAnySpec && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5" />Provenance &amp; Cooperage
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-2">
            {cask?.spirit_type && <Row label="Spirit Type" value={SPIRIT_TYPE_LABELS[cask.spirit_type] ?? cask.spirit_type} />}
            {cask?.wood_species && <Row label="Wood Species" value={WOOD_SPECIES_LABELS[cask.wood_species] ?? cask.wood_species} />}
            {cask?.cask_fill_generation && (
              <Row label="Fill Generation" value={FILL_GENERATION_LABELS[cask.cask_fill_generation] ?? cask.cask_fill_generation} />
            )}
            {cask?.previous_contents && (
              <Row label="Previous Contents" value={PREVIOUS_CONTENTS_LABELS[cask.previous_contents] ?? cask.previous_contents} />
            )}
            {cask?.char_level != null && <Row label="Char Level" value={`${cask.char_level} / 4`} />}
            {cask?.toast_level && <Row label="Toast Level" value={TOAST_LEVEL_LABELS[cask.toast_level] ?? cask.toast_level} />}
            {cask?.cooperage && <Row label="Cooperage" value={cask.cooperage} />}
            {cask?.dsp_code && <Row label="DSP / Warehouse Code" value={cask.dsp_code} />}
            {cask?.original_lpa != null && <Row label="Original LPA" value={`${cask.original_lpa} L`} />}
            {cask?.duty_status && (
              <Row label="Duty Status" value={<Badge variant="secondary">{DUTY_STATUS_LABELS[cask.duty_status] ?? cask.duty_status}</Badge>} />
            )}
            {cask?.insurance_valuation != null && (
              <Row
                label="Insurance Valuation"
                value={`${cask.insurance_valuation.toLocaleString()}${cask.insurance_valuation_at ? ` (as of ${new Date(cask.insurance_valuation_at).toLocaleDateString()})` : ""}`}
              />
            )}
            {cask?.provenance_doc_hash && (
              <Row
                label="Provenance Docs"
                value={
                  <a
                    className="text-primary hover:underline break-all"
                    href={`https://ipfs.io/ipfs/${cask.provenance_doc_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {cask.provenance_doc_hash.slice(0, 16)}…
                  </a>
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />Regauge History
          </CardTitle>
          {canManage && <AddRegaugeDialog caskId={caskId} onAdded={fetchAll} />}
        </CardHeader>
        <CardContent>
          {angelsShareRate != null && (
            <p className="text-sm text-muted-foreground mb-4">
              Angel&apos;s share rate (derived): <strong>{angelsShareRate.toFixed(2)}% / year</strong>
            </p>
          )}
          {regauges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No regauges recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {regauges.map((r) => (
                <div key={r.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-border/40 pb-2 text-sm last:border-0">
                  <span className="font-medium">{new Date(r.regauge_date).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">RLA <strong className="text-foreground">{r.rla_liters} L</strong></span>
                  <span className="text-muted-foreground">Bulk <strong className="text-foreground">{r.bulk_liters} L</strong></span>
                  <span className="text-muted-foreground">ABV <strong className="text-foreground">{r.abv}%</strong></span>
                  {r.notes && <span className="text-muted-foreground italic">{r.notes}</span>}
                  <AttachmentChip url={r.document_url} filename={r.document_filename} type={r.document_type} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />Transfer &amp; Maturation Events
          </CardTitle>
          {canManage && <AddTransferDialog caskId={caskId} onAdded={fetchAll} />}
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transfers recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {transfers.map((t) => (
                <div key={t.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-border/40 pb-2 text-sm last:border-0">
                  <span className="font-medium">{new Date(t.transfer_date).toLocaleDateString()}</span>
                  <Badge variant="outline">{TRANSFER_TYPE_LABELS[t.transfer_type] ?? t.transfer_type}</Badge>
                  {t.reason && <span className="text-muted-foreground">{t.reason}</span>}
                  {t.doc_hash && (
                    <a
                      className="text-primary hover:underline text-xs break-all"
                      href={`https://ipfs.io/ipfs/${t.doc_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Doc: {t.doc_hash.slice(0, 12)}…
                    </a>
                  )}
                  <AttachmentChip url={t.document_url} filename={t.document_filename} type={t.document_type} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------- Add Regauge dialog -------------------------- */
const AddRegaugeDialog = ({ caskId, onAdded }: { caskId: string; onAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    regauge_date: new Date().toISOString().slice(0, 10),
    rla_liters: "",
    bulk_liters: "",
    abv: "",
    notes: "",
  });
  const [doc, setDoc] = useState<DocumentAttachState>({ ...emptyDoc, doc_type: "regauge_report" });

  const submit = async () => {
    if (!form.regauge_date || !form.rla_liters || !form.bulk_liters || !form.abv) {
      toast.error("Date, RLA, bulk litres and ABV are required");
      return;
    }
    setBusy(true);
    const uploaded = await uploadEventDocument(caskId, doc);
    if (doc.file && !uploaded) {
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("cask_regauges").insert({
      cask_id: caskId,
      regauge_date: form.regauge_date,
      rla_liters: parseFloat(form.rla_liters),
      bulk_liters: parseFloat(form.bulk_liters),
      abv: parseFloat(form.abv),
      notes: form.notes || null,
      document_url: uploaded?.url ?? null,
      document_filename: uploaded?.filename ?? null,
      document_type: uploaded?.type ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Regauge recorded");
    setOpen(false);
    setForm({ regauge_date: new Date().toISOString().slice(0, 10), rla_liters: "", bulk_liters: "", abv: "", notes: "" });
    setDoc({ ...emptyDoc, doc_type: "regauge_report" });
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Add Regauge</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Regauge</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label>Date</Label>
            <Input type="date" value={form.regauge_date} onChange={(e) => setForm({ ...form, regauge_date: e.target.value })} />
          </div>
          <div className="space-y-1"><Label>RLA (L)</Label><Input type="number" step="0.01" value={form.rla_liters} onChange={(e) => setForm({ ...form, rla_liters: e.target.value })} /></div>
          <div className="space-y-1"><Label>Bulk (L)</Label><Input type="number" step="0.01" value={form.bulk_liters} onChange={(e) => setForm({ ...form, bulk_liters: e.target.value })} /></div>
          <div className="space-y-1 col-span-2"><Label>ABV (%)</Label><Input type="number" step="0.1" value={form.abv} onChange={(e) => setForm({ ...form, abv: e.target.value })} /></div>
          <div className="space-y-1 col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DocumentAttachField state={doc} onChange={setDoc} />
        </div>
        <Button onClick={submit} disabled={busy} className="w-full">{busy ? "Saving…" : "Save Regauge"}</Button>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------- Add Transfer dialog -------------------------- */
const AddTransferDialog = ({ caskId, onAdded }: { caskId: string; onAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    transfer_date: new Date().toISOString().slice(0, 10),
    transfer_type: "re_rack",
    reason: "",
    doc_hash: "",
  });
  const [doc, setDoc] = useState<DocumentAttachState>({ ...emptyDoc, doc_type: "transfer_note" });

  const submit = async () => {
    if (!form.transfer_date || !form.transfer_type) {
      toast.error("Date and type are required");
      return;
    }
    const cidErr = cidError(form.doc_hash);
    if (cidErr) {
      toast.error(`Document Hash: ${cidErr}`);
      return;
    }
    setBusy(true);
    const uploaded = await uploadEventDocument(caskId, doc);
    if (doc.file && !uploaded) {
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("cask_transfers").insert({
      cask_id: caskId,
      transfer_date: form.transfer_date,
      transfer_type: form.transfer_type as any,
      reason: form.reason || null,
      doc_hash: form.doc_hash || null,
      document_url: uploaded?.url ?? null,
      document_filename: uploaded?.filename ?? null,
      document_type: uploaded?.type ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transfer recorded");
    setOpen(false);
    setForm({ transfer_date: new Date().toISOString().slice(0, 10), transfer_type: "re_rack", reason: "", doc_hash: "" });
    setDoc({ ...emptyDoc, doc_type: "transfer_note" });
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Add Event</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Transfer / Event</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.transfer_date} onChange={(e) => setForm({ ...form, transfer_date: e.target.value })} /></div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={form.transfer_type} onValueChange={(v) => setForm({ ...form, transfer_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSFER_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2"><Label>Reason / Notes</Label><Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="space-y-1 col-span-2">
            <Label>Document Hash (IPFS CID)</Label>
            <Input
              value={form.doc_hash}
              onChange={(e) => setForm({ ...form, doc_hash: e.target.value })}
              placeholder="Qm… or bafy…"
              aria-invalid={!!cidError(form.doc_hash)}
            />
            {cidError(form.doc_hash) && (
              <p className="text-xs text-destructive">{cidError(form.doc_hash)}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional. Paste the IPFS CID for the supporting document (re-rack note, transfer paperwork).
            </p>
          </div>
          <DocumentAttachField state={doc} onChange={setDoc} />
        </div>
        <Button onClick={submit} disabled={busy || !!cidError(form.doc_hash)} className="w-full">{busy ? "Saving…" : "Save Event"}</Button>
      </DialogContent>
    </Dialog>
  );
};

export default CaskProvenancePanel;