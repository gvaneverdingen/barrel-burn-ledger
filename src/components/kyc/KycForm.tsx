import { useEffect, useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Info, Loader2, ShieldCheck, XCircle } from 'lucide-react';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

const schema = z.object({
  legal_first_name: z.string().trim().min(1, 'Required').max(100),
  legal_last_name: z.string().trim().min(1, 'Required').max(100),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required').refine((d) => {
    const age = (Date.now() - new Date(d).getTime()) / (365.25 * 864e5);
    return age >= 18 && age < 120;
  }, 'You must be at least 18'),
  nationality: z.string().trim().min(2, 'Required').max(60),
  address_line: z.string().trim().min(3, 'Required').max(200),
  city: z.string().trim().min(1, 'Required').max(100),
  postal_code: z.string().trim().min(2, 'Required').max(20),
  country: z.string().trim().min(2, 'Required').max(60),
  id_document_type: z.enum(['passport', 'drivers_license', 'national_id']),
  id_document_number: z.string().trim().min(4, 'Required').max(40).regex(/^[A-Za-z0-9 -]+$/, 'Letters and numbers only'),
});

type FormState = z.infer<typeof schema>;
type FileKey = 'id_front' | 'id_back' | 'proof_of_address' | 'selfie';

interface Submission {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes: string | null;
  created_at: string;
}

const empty: FormState = {
  legal_first_name: '', legal_last_name: '', date_of_birth: '', nationality: '',
  address_line: '', city: '', postal_code: '', country: '',
  id_document_type: 'passport', id_document_number: '',
};

export function KycForm({ onStatusChange }: { onStatusChange?: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(empty);
  const [files, setFiles] = useState<Partial<Record<FileKey, File>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [latest, setLatest] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('kyc_submissions')
      .select('id,status,reviewer_notes,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatest(data ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const set = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const pickFile = (k: FileKey, f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BYTES) { setErrors((e) => ({ ...e, [k]: 'Max 10 MB' })); return; }
    if (!ACCEPT.split(',').includes(f.type)) { setErrors((e) => ({ ...e, [k]: 'Use JPG, PNG, WEBP or PDF' })); return; }
    setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
    setFiles((p) => ({ ...p, [k]: f }));
  };

  const upload = async (k: FileKey, f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const path = `${user!.id}/${Date.now()}-${k}.${ext}`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, f, { contentType: f.type });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
    if (!files.id_front) errs.id_front = 'Required';
    if (form.id_document_type !== 'passport' && !files.id_back) errs.id_back = 'Required for this ID type';
    if (!files.proof_of_address) errs.proof_of_address = 'Required';
    if (!files.selfie) errs.selfie = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.success) {
      toast({ title: 'Please check the form', description: 'Some fields need your attention.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const id_front_path = await upload('id_front', files.id_front!);
      const id_back_path = files.id_back ? await upload('id_back', files.id_back) : null;
      const proof_of_address_path = await upload('proof_of_address', files.proof_of_address!);
      const selfie_path = await upload('selfie', files.selfie!);
      const { error } = await (supabase as any).from('kyc_submissions').insert({
        ...parsed.data, user_id: user.id, id_front_path, id_back_path, proof_of_address_path, selfie_path,
      });
      if (error) throw error;
      toast({ title: 'Verification submitted', description: 'We will review your documents shortly.' });
      setFiles({}); setForm(empty);
      await load();
      onStatusChange?.();
    } catch (e: any) {
      console.error('KYC submit failed', e);
      toast({ title: 'Submission failed', description: e?.message ?? 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (latest?.status === 'approved') {
    return (
      <Alert className="border-primary/40">
        <CheckCircle className="h-4 w-4 text-primary" />
        <AlertDescription>Your identity is verified. Wallet payments are unlocked.</AlertDescription>
      </Alert>
    );
  }
  if (latest?.status === 'pending') {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Your documents were submitted on {new Date(latest.created_at).toLocaleDateString()} and are under review. You'll get a notification once a decision is made.
        </AlertDescription>
      </Alert>
    );
  }

  const field = (k: keyof FormState, label: string, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <Label htmlFor={`kyc-${k}`}>{label}</Label>
      <Input id={`kyc-${k}`} type={type} value={form[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  const fileField = (k: FileKey, label: string, hint: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`kyc-${k}`}>{label}</Label>
      <Input id={`kyc-${k}`} type="file" accept={ACCEPT} onChange={(e) => pickFile(k, e.target.files?.[0])} aria-invalid={!!errors[k]} />
      <p className="text-xs text-muted-foreground">{files[k] ? `Selected: ${files[k]!.name}` : hint}</p>
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {latest?.status === 'rejected' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Your previous submission was not approved{latest.reviewer_notes ? `: ${latest.reviewer_notes}` : '.'} Please resubmit below.</AlertDescription>
        </Alert>
      )}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Verification is required by law before buying casks with a crypto wallet. Your documents are stored privately and only seen by the ARIGI compliance team.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Badge variant="outline">1</Badge> Personal details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('legal_first_name', 'Legal first name')}
          {field('legal_last_name', 'Legal last name')}
          {field('date_of_birth', 'Date of birth', 'date')}
          {field('nationality', 'Nationality', 'text', 'e.g. Dutch')}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Badge variant="outline">2</Badge> Residential address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field('address_line', 'Street and number')}</div>
          {field('city', 'City')}
          {field('postal_code', 'Postal code')}
          {field('country', 'Country')}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Badge variant="outline">3</Badge> Identity document</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Select value={form.id_document_type} onValueChange={(v) => set('id_document_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="drivers_license">Driver's licence</SelectItem>
                <SelectItem value="national_id">National ID card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {field('id_document_number', 'Document number')}
          {fileField('id_front', 'Front of document', 'Clear photo, all corners visible')}
          {form.id_document_type !== 'passport' && fileField('id_back', 'Back of document', 'Required for licences and ID cards')}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Badge variant="outline">4</Badge> Supporting documents</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {fileField('proof_of_address', 'Proof of address', 'Utility bill or bank statement, max 3 months old')}
          {fileField('selfie', 'Selfie holding your ID', 'Face and document clearly visible')}
        </div>
      </section>

      <Button onClick={submit} disabled={submitting} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {submitting ? 'Uploading…' : 'Submit for verification'}
      </Button>
    </div>
  );
}
