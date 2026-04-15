import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const SalesReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleDownloadCSV = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from('transactions')
        .select('id, created_at, total_amount, platform_fee, distillery_fee, seller_amount, volume_liters, price_per_liter, status, transaction_type, cask_id')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: 'No data', description: 'No transactions found for the selected period.' });
        setLoading(false);
        return;
      }

      const headers = ['Date', 'Transaction ID', 'Type', 'Status', 'Volume (L)', 'Price/L (£)', 'Total (£)', 'Platform Fee (£)', 'Distillery Fee (£)', 'Seller Amount (£)'];
      const rows = data.map(t => [
        new Date(t.created_at).toLocaleDateString('en-GB'),
        t.id,
        t.transaction_type,
        t.status,
        t.volume_liters,
        t.price_per_liter,
        t.total_amount,
        t.platform_fee,
        t.distillery_fee,
        t.seller_amount ?? '',
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${dateFrom || 'all'}-to-${dateTo || 'now'}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Report downloaded', description: `${data.length} transactions exported.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate report.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Sales Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateFrom">From</Label>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dateTo">To</Label>
            <Input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleDownloadCSV} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download CSV Report
        </Button>
      </CardContent>
    </Card>
  );
};
