import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PriceAlertButtonProps {
  caskId: string;
  currentPrice: number | null;
}

export const PriceAlertButton = ({ caskId, currentPrice }: PriceAlertButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingAlert, setExistingAlert] = useState<any>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState<'below' | 'above'>('below');

  useEffect(() => {
    if (user && caskId) {
      fetchExistingAlert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, caskId]);

  const fetchExistingAlert = async () => {
    const { data } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('cask_id', caskId)
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      setExistingAlert(data);
      setTargetPrice(String(data.target_price));
      setAlertType(data.alert_type);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.toast({ title: 'Invalid price', description: 'Enter a valid target price.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (existingAlert) {
        await supabase.from('price_alerts').update({ target_price: price, alert_type: alertType }).eq('id', existingAlert.id);
      } else {
        await supabase.from('price_alerts').insert({ user_id: user.id, cask_id: caskId, target_price: price, alert_type: alertType });
      }
      toast.toast({ title: 'Price alert set', description: `You'll be notified when price goes ${alertType} £${price.toLocaleString()}` });
      setOpen(false);
      fetchExistingAlert();
    } catch {
      toast.toast({ title: 'Error', description: 'Failed to save alert.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!existingAlert) return;
    setLoading(true);
    await supabase.from('price_alerts').update({ is_active: false }).eq('id', existingAlert.id);
    setExistingAlert(null);
    setTargetPrice('');
    toast.toast({ title: 'Alert removed' });
    setLoading(false);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {existingAlert ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {existingAlert ? 'Alert Set' : 'Price Alert'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <h4 className="font-medium text-sm">Set Price Alert</h4>
        {currentPrice && (
          <p className="text-xs text-muted-foreground">Current price: £{currentPrice.toLocaleString()}</p>
        )}
        <div className="space-y-2">
          <Label className="text-xs">Alert when price goes</Label>
          <Select value={alertType} onValueChange={(v) => setAlertType(v as 'below' | 'above')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="below">Below</SelectItem>
              <SelectItem value="above">Above</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Target price (£)</Label>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="e.g. 5000"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : existingAlert ? 'Update' : 'Set Alert'}
          </Button>
          {existingAlert && (
            <Button size="sm" variant="destructive" onClick={handleRemove} disabled={loading}>
              Remove
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
