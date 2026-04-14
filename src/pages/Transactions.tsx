import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, Filter, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Transactions = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

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
      date: format(new Date(t.created_at), 'MMM dd, yyyy'),
      type: 'Purchase' as const,
      description: `${t.cask?.spirit_name} - ${t.cask?.cask_number}`,
      amount: t.total_amount,
      status: t.status === 'completed' ? 'Completed' : t.status === 'pending' ? 'Pending' : 'Failed',
      method: 'Stripe',
      rawDate: t.created_at,
    })),
    ...(payouts || []).map(p => ({
      id: p.id.slice(0, 8),
      date: format(new Date(p.created_at), 'MMM dd, yyyy'),
      type: 'Payout' as const,
      description: p.description || `${p.transaction?.cask?.spirit_name} - ${p.transaction?.cask?.cask_number}`,
      amount: p.amount,
      status: p.status === 'pending_payout' ? 'Pending' : p.status === 'completed' ? 'Completed' : 'Processing',
      method: 'Bank Transfer',
      rawDate: p.created_at,
    }))
  ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const totalSpent = purchases?.reduce((sum, t) => sum + (t.status === 'completed' ? Number(t.total_amount) : 0), 0) || 0;
  const totalEarned = payouts?.reduce((sum, p) => sum + (p.status !== 'failed' ? Number(p.amount) : 0), 0) || 0;
  const pendingPayouts = payouts?.filter(p => p.status === 'pending_payout').length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-600/15 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-800">Completed</Badge>;
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "Processing":
        return <Badge className="bg-blue-600/15 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-800">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <SignInPrompt
        title="Sign in to view transactions"
        description="You need to be signed in to view your transaction history."
      />
    );
  }

  return (
    <div className="mobile-container space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
              <p className="text-sm text-muted-foreground">Your purchase and payout history</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => {
              if (allTransactions.length === 0) return;
              const headers = ["ID", "Date", "Type", "Description", "Amount", "Status", "Method"];
              const rows = allTransactions.map(tx => [
                tx.id,
                tx.date,
                tx.type,
                `"${tx.description}"`,
                tx.amount,
                tx.status,
                tx.method,
              ]);
              const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={allTransactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{formatPrice(totalSpent)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{formatPrice(totalEarned)}</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold">{pendingPayouts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List - Mobile-friendly card layout */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
            <Badge variant="secondary">{allTransactions.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {allTransactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">
                Your purchases and payouts will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-4 sm:px-6 hover:bg-muted/50 transition-colors">
                  <div className={`shrink-0 p-2 rounded-full ${tx.type === 'Purchase' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    {tx.type === 'Purchase' ? (
                      <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{tx.method}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === 'Payout' ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {tx.type === 'Payout' ? '+' : '-'}{formatPrice(tx.amount)}
                    </p>
                    <div className="mt-1">{getStatusBadge(tx.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
