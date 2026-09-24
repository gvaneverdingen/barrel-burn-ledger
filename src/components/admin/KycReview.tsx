import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Check, ExternalLink, Loader2, X } from 'lucide-react';

interface Sub {
  id: string; user_id: string; legal_first_name: string; legal_last_name: string; date_of_birth: string;
  nationality: string; address_line: string; city: string; postal_code: string; country: string;
  id_document_type: string; id_document_number: string; id_front_path: string; id_back_path: string | null;
  proof_of_address_path: string; selfie_path: string; status: string; reviewer_notes: string | null; created_at: string;
}

export function KycReview() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any).from('kyc_submissions').select('*').order('created_at', { ascending: false }).limit(200);
    if (filter === 'pending') q = q.eq('status', 'pending');
    const { data, error } = await q;
    if (error) toast({ title: 'Failed to load submissions', description: error.message, variant: 'destructive' });
    setSubs(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const openDoc = async (path: string) => {
    const w = window.open('', '_blank');
    const { data, error } = await supabase.storage.from('kyc-documents').createSignedUrl(path, 300);
    if (error || !data) { w?.close(); toast({ title: 'Could not open document', variant: 'destructive' }); return; }
    if (w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
  };

  const review = async (id: string, approve: boolean) => {
    if (!approve && !notes[id]?.trim()) {
      toast({ title: 'Add a reason', description: 'The client sees this note when rejected.', variant: 'destructive' });
      return;
    }
    setBusy(id);
    const { error } = await (supabase as any).rpc('review_kyc_submission', { _submission_id: id, _approve: approve, _notes: notes[id]?.trim() || null });
    setBusy(null);
    if (error) { toast({ title: 'Review failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: approve ? 'Client verified' : 'Submission rejected' });
    load();
  };

  const docBtn = (label: string, path: string | null) => path && (
    <Button variant="outline" size="sm" className="gap-1" onClick={() => openDoc(path)}>
      <ExternalLink className="h-3 w-3" />{label}
    </Button>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Identity verification (KYC)</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> :
          subs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No submissions to show.</p> :
          subs.map((s) => (
            <div key={s.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.legal_first_name} {s.legal_last_name}</p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(s.created_at).toLocaleString()}</p>
                </div>
                <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}>{s.status}</Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p><span className="text-muted-foreground">Born:</span> {s.date_of_birth}</p>
                <p><span className="text-muted-foreground">Nationality:</span> {s.nationality}</p>
                <p className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {s.address_line}, {s.postal_code} {s.city}, {s.country}</p>
                <p><span className="text-muted-foreground">ID:</span> {s.id_document_type.replace('_', ' ')} · {s.id_document_number}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {docBtn('ID front', s.id_front_path)}
                {docBtn('ID back', s.id_back_path)}
                {docBtn('Proof of address', s.proof_of_address_path)}
                {docBtn('Selfie', s.selfie_path)}
              </div>
              {s.status === 'pending' ? (
                <>
                  <Textarea placeholder="Note to client (required when rejecting)" value={notes[s.id] ?? ''} maxLength={500}
                    onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1" disabled={busy === s.id} onClick={() => review(s.id, true)}><Check className="h-4 w-4" />Approve</Button>
                    <Button size="sm" variant="destructive" className="gap-1" disabled={busy === s.id} onClick={() => review(s.id, false)}><X className="h-4 w-4" />Reject</Button>
                  </div>
                </>
              ) : s.reviewer_notes && <p className="text-sm text-muted-foreground">Note: {s.reviewer_notes}</p>}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
