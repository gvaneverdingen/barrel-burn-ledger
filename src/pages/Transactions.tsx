import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Transactions = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  // Fetch transactions where user is buyer
  const { data: purchases } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*, cask:casks(spirit_name, cask_number)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch payouts where user is recipient
  const { data: payouts } = useQuery({
    queryKey: ['user-payouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payouts')
        .select('*, transaction:transactions(*, cask:casks(spirit_name, cask_number))')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const allTransactions = [
    ...(purchases || []).map(t => ({
      id: t.id.slice(0, 8),
      date: format(new Date(t.created_at), 'yyyy-MM-dd'),
      type: 'Purchase',
      description: `${t.cask?.spirit_name} - ${t.cask?.cask_number}`,
      amount: formatPrice(t.total_amount),
      status: t.status === 'completed' ? 'Completed' : t.status === 'pending' ? 'Pending' : 'Failed',
      method: 'Stripe'
    })),
    ...(payouts || []).map(p => ({
      id: p.id.slice(0, 8),
      date: format(new Date(p.created_at), 'yyyy-MM-dd'),
      type: 'Sale Payout',
      description: p.description || `${p.transaction?.cask?.spirit_name} - ${p.transaction?.cask?.cask_number}`,
      amount: formatPrice(p.amount),
      status: p.status === 'pending_payout' ? 'Pending Payout' : p.status === 'completed' ? 'Completed' : 'Processing',
      method: 'Bank Transfer'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpent = purchases?.reduce((sum, t) => sum + (t.status === 'completed' ? Number(t.total_amount) : 0), 0) || 0;
  const totalEarned = payouts?.reduce((sum, p) => sum + (p.status !== 'failed' ? Number(p.amount) : 0), 0) || 0;
  const pendingPayouts = payouts?.filter(p => p.status === 'pending_payout').length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "Pending":
      case "Pending Payout":
        return <Badge variant="secondary">{status}</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "Processing":
        return <Badge className="bg-blue-500">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Transactions</h1>
          </div>
        </header>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Transaction History</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    allTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.date}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-mono">{transaction.amount}</TableCell>
                        <TableCell>{transaction.method}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
                <p className="text-sm text-muted-foreground">All purchases</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${totalEarned.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">From resales</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pending Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingPayouts}</p>
                <p className="text-sm text-muted-foreground">{pendingPayouts === 1 ? 'Payout' : 'Payouts'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Transactions;