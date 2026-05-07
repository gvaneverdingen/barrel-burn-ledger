import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Building2, Save, Shield, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DistilleryRow {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  website: string | null;
  established_year: number | null;
  license_number: string | null;
  logo_url: string | null;
  verified: boolean | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  userId: string;
  email: string;
}

export const DistilleryProfileSection: React.FC<Props> = ({ userId, email }) => {
  const navigate = useNavigate();
  const [distillery, setDistillery] = useState<DistilleryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    description: '',
    website: '',
    established_year: '',
    license_number: '',
    logo_url: '',
  });

  useEffect(() => {
    void fetchDistillery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchDistillery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('distilleries')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) {
      toast({ title: 'Error', description: 'Failed to load distillery.', variant: 'destructive' });
    } else if (data) {
      setDistillery(data as DistilleryRow);
      setForm({
        name: data.name || '',
        location: data.location || '',
        description: data.description || '',
        website: data.website || '',
        established_year: data.established_year ? String(data.established_year) : '',
        license_number: data.license_number || '',
        logo_url: data.logo_url || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!distillery) return;
    setIsSaving(true);
    const yearNum = form.established_year ? parseInt(form.established_year, 10) : null;
    const { error } = await supabase
      .from('distilleries')
      .update({
        name: form.name.trim(),
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        established_year: yearNum && !Number.isNaN(yearNum) ? yearNum : null,
        license_number: form.license_number.trim() || null,
        logo_url: form.logo_url.trim() || null,
      })
      .eq('id', distillery.id);

    setIsSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: 'Distillery details updated.' });
    setIsEditing(false);
    void fetchDistillery();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Loading distillery…</CardContent>
      </Card>
    );
  }

  if (!distillery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            No Distillery Profile
          </CardTitle>
          <CardDescription>Apply to set up your distillery profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/distillery/onboarding')}>Apply to Become a Distillery</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Distillery Information
            </CardTitle>
            <CardDescription>Public details shown on your distillery profile.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {distillery.verified ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Shield className="h-3 w-3 mr-1" /> Verified
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Shield className="h-3 w-3 mr-1" /> Pending Verification
              </Badge>
            )}
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Account Email</Label>
              <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{email}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Distillery ID</Label>
              <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded-md truncate">{distillery.id}</div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Distillery Name</Label>
              {isEditing ? (
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              ) : (
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{distillery.name}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Speyside, Scotland" />
              ) : (
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{distillery.location || 'Not provided'}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="established_year">Established Year</Label>
              {isEditing ? (
                <Input id="established_year" type="number" value={form.established_year} onChange={(e) => setForm((f) => ({ ...f, established_year: e.target.value }))} placeholder="e.g. 1887" />
              ) : (
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{distillery.established_year || 'Not provided'}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input id="website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://" />
              ) : (
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md flex items-center gap-2">
                  {distillery.website ? (
                    <a href={distillery.website} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      {distillery.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : 'Not provided'}
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              {isEditing ? (
                <Input id="logo_url" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://…/logo.png" />
              ) : (
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md truncate">{distillery.logo_url || 'Not provided'}</div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Tell collectors about your distillery, heritage and craft." />
              ) : (
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md whitespace-pre-wrap">{distillery.description || 'Not provided'}</div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="license_number">License Number (private)</Label>
              {isEditing ? (
                <Input id="license_number" value={form.license_number} onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))} placeholder="Regulatory license number" />
              ) : (
                <div className="text-sm bg-muted/50 px-3 py-2 rounded-md">{distillery.license_number || 'Not provided'}</div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving || !form.name.trim()} className="gap-2">
                <Save className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button variant="outline" disabled={isSaving} onClick={() => { setIsEditing(false); void fetchDistillery(); }}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Status
          </CardTitle>
          <CardDescription>
            {distillery.verified
              ? 'Your distillery is verified and visible to buyers across the marketplace.'
              : 'Submit verification documents to unlock listing, payouts and public profile features.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant={distillery.verified ? 'outline' : 'default'} onClick={() => navigate('/distillery/verification')}>
            {distillery.verified ? 'Manage Verification' : 'Start Verification'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistilleryProfileSection;