import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Transaction {
  id: string;
  transaction_type: string;
  total_amount: number;
  status: string;
  blockchain_transaction_hash: string | null;
  created_at: string;
  completed_at: string | null;
  cask_id: string;
  buyer_id: string;
  seller_id: string;
  volume_liters: number;
  spirit_name: string;
  cask_number: string;
}

export default function BlockchainTesting() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTx, setProcessingTx] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletedTransactions();
  }, []);

  const fetchCompletedTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          casks(spirit_name, cask_number)
        `)
        .eq('status', 'completed')
        .is('blockchain_transaction_hash', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(tx => ({
        ...tx,
        spirit_name: tx.casks?.spirit_name || 'Unknown',
        cask_number: tx.casks?.cask_number || 'Unknown'
      })) || [];

      setTransactions(formattedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const triggerBlockchainRegistration = async (transaction: Transaction) => {
    setProcessingTx(transaction.id);
    
    try {
      console.log('Triggering blockchain registration for:', transaction.id);
      
      // Call the blockchain-logger function directly
      const { data, error } = await supabase.functions.invoke('blockchain-logger', {
        body: {
          caskId: transaction.cask_id,
          buyerId: transaction.buyer_id,
          sellerId: transaction.seller_id,
          transactionType: 'purchase',
          volume: transaction.volume_liters,
          price: transaction.total_amount,
          timestamp: Date.now()
        }
      });

      if (error) {
        console.error('Blockchain registration error:', error);
        throw new Error(error.message || 'Failed to register on blockchain');
      }

      console.log('Blockchain registration successful:', data);
      
      toast.success(`Transaction registered on Polygon! Hash: ${data.transactionHash?.substring(0, 10)}...`);
      
      // Refresh the transactions list
      await fetchCompletedTransactions();
      
    } catch (error) {
      console.error('Error registering transaction:', error);
      toast.error(`Failed to register on blockchain: ${error.message}`);
    } finally {
      setProcessingTx(null);
    }
  };

  const getPolygonScanUrl = (hash: string) => {
    // For testnet, use Mumbai testnet explorer
    return `https://mumbai.polygonscan.com/tx/${hash}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Blockchain Testing (Polygon Testnet)</h1>
        <p className="text-muted-foreground">
          Test blockchain registration for completed transactions on Polygon Mumbai testnet
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Testing Environment:</strong> This will register transactions on Polygon Mumbai testnet. 
          Make sure the POLYGON_RPC_URL and POLYGON_PRIVATE_KEY are configured for testnet.
        </AlertDescription>
      </Alert>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">No Pending Transactions</h3>
            <p className="text-muted-foreground">
              All completed transactions have been registered on the blockchain.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Transactions Ready for Blockchain Registration</CardTitle>
              <CardDescription>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} ready to be registered on Polygon testnet
              </CardDescription>
            </CardHeader>
          </Card>

          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Purchase: {tx.spirit_name}
                    </CardTitle>
                    <CardDescription>
                      Cask #{tx.cask_number} • ${(tx.total_amount / 100).toFixed(2)}
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Ready for Blockchain
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Transaction ID</label>
                    <p className="font-mono text-xs">{tx.id}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Volume</label>
                    <p>{tx.volume_liters}L</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Completed</label>
                    <p>{new Date(tx.completed_at!).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Status</label>
                    <Badge variant="outline" className="text-green-600">
                      {tx.status}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => triggerBlockchainRegistration(tx)}
                    disabled={processingTx === tx.id}
                    className="w-full"
                  >
                    {processingTx === tx.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering on Polygon...
                      </>
                    ) : (
                      'Register on Polygon Testnet'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">1. Verify Configuration</h4>
              <p className="text-sm text-muted-foreground">
                Ensure POLYGON_RPC_URL points to Mumbai testnet and POLYGON_PRIVATE_KEY has testnet MATIC
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">2. Register Transaction</h4>
              <p className="text-sm text-muted-foreground">
                Click "Register on Polygon Testnet" to log the transaction data on-chain
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">3. Verify on Explorer</h4>
              <p className="text-sm text-muted-foreground">
                Use the transaction hash to view the logged data on PolygonScan Mumbai
              </p>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Testnet Requirements:</strong> The wallet needs testnet MATIC for gas fees. 
              Get free testnet MATIC from the <a 
                href="https://faucet.polygon.technology/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Polygon Faucet <ExternalLink className="inline h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}