import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, ExternalLink, Clock } from "lucide-react";

interface Transaction {
  id: string;
  total_amount: number;
  price_per_liter: number;
  volume_liters: number;
  transaction_type: string;
  status: string | null;
  created_at: string;
  completed_at: string | null;
  blockchain_transaction_hash: string | null;
  platform_fee: number;
  distillery_fee: number;
  buyer: { first_name: string | null; last_name: string | null } | null;
  seller: { first_name: string | null; last_name: string | null } | null;
}

interface CaskTransactionHistoryProps {
  caskId: string;
}

const CaskTransactionHistory = ({ caskId }: CaskTransactionHistoryProps) => {
  const { formatPrice } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select(`
            id,
            total_amount,
            price_per_liter,
            volume_liters,
            transaction_type,
            status,
            created_at,
            completed_at,
            blockchain_transaction_hash,
            platform_fee,
            distillery_fee,
            buyer:profiles!transactions_buyer_id_fkey(first_name, last_name),
            seller:profiles!transactions_seller_id_fkey(first_name, last_name)
          `)
          .eq("cask_id", caskId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTransactions((data as unknown as Transaction[]) || []);
      } catch (error) {
        console.error("Error fetching cask transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [caskId]);

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const formatName = (profile: { first_name: string | null; last_name: string | null } | null) => {
    if (!profile) return "Unknown";
    const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    return name || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRightLeft className="h-5 w-5" />
          <span>Transaction History</span>
        </CardTitle>
        <CardDescription>
          {transactions.length === 0
            ? "No transactions recorded for this cask yet."
            : `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} on record`}
        </CardDescription>
      </CardHeader>
      {transactions.length > 0 && (
        <CardContent className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {statusBadge(tx.status)}
                  <Badge variant="outline" className="capitalize">
                    {tx.transaction_type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="text-lg font-bold text-primary">
                  {formatPrice(tx.total_amount)}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Seller</p>
                  <p className="font-medium">{formatName(tx.seller)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Buyer</p>
                  <p className="font-medium">{formatName(tx.buyer)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(tx.completed_at || tx.created_at)}
                  </p>
                </div>
              </div>

              {tx.blockchain_transaction_hash && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Blockchain Tx:</span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${tx.blockchain_transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary hover:underline flex items-center gap-1 truncate max-w-[280px]"
                  >
                    {tx.blockchain_transaction_hash.slice(0, 10)}...{tx.blockchain_transaction_hash.slice(-8)}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default CaskTransactionHistory;
