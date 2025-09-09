import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

export default function BlockchainExample() {
  // Example of a completed transaction that would be registered on blockchain
  const exampleTransaction = {
    id: "dcfcd033-dfa7-4158-ba64-e09d5fa87c89",
    transaction_type: "purchase",
    total_amount: 90000, // $900.00
    status: "completed",
    blockchain_transaction_hash: "0x8f2a3b7c9d1e4f6a8b2c5d9e7f1a4b6c8d2e5f7a9b3c6d8e1f4a7b9c2d5e8f1a",
    created_at: "2025-08-31T19:33:47Z",
    completed_at: "2025-08-31T19:36:22Z",
    cask_name: "Highland Single Malt",
    buyer_email: "buyer@example.com"
  };

  const polygonScanUrl = `https://polygonscan.com/tx/${exampleTransaction.blockchain_transaction_hash}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Blockchain Transaction Example</h1>
        <p className="text-muted-foreground">
          Example of how a completed cask purchase appears on the Polygon blockchain
        </p>
      </div>

      <div className="grid gap-6">
        {/* Transaction Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Cask Purchase Transaction
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Blockchain Confirmed
              </Badge>
            </CardTitle>
            <CardDescription>
              Purchase of {exampleTransaction.cask_name} - Registered on Polygon Network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                <p className="font-mono text-sm">{exampleTransaction.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="text-lg font-semibold">${(exampleTransaction.total_amount / 100).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge className="bg-green-100 text-green-800">{exampleTransaction.status}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="capitalize">{exampleTransaction.transaction_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Details */}
        <Card>
          <CardHeader>
            <CardTitle>Blockchain Registration Details</CardTitle>
            <CardDescription>
              This transaction has been permanently recorded on the Polygon blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Blockchain Network</label>
              <p className="flex items-center gap-2">
                <span className="font-semibold">Polygon (MATIC)</span>
                <Badge variant="outline">Layer 2</Badge>
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm font-mono break-all">
                  {exampleTransaction.blockchain_transaction_hash}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(exampleTransaction.blockchain_transaction_hash)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <Button asChild className="w-full">
                <a 
                  href={polygonScanUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on PolygonScan
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Transaction Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(exampleTransaction.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Payment Processed</p>
                  <p className="text-sm text-muted-foreground">Stripe payment completed</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Admin Approved</p>
                  <p className="text-sm text-muted-foreground">Transaction approved for blockchain registration</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Blockchain Registered</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(exampleTransaction.completed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Stored on Blockchain */}
        <Card>
          <CardHeader>
            <CardTitle>Blockchain Data Structure</CardTitle>
            <CardDescription>
              Example of data that gets serialized and stored on-chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{JSON.stringify({
  transactionId: exampleTransaction.id,
  type: "CASK_PURCHASE",
  timestamp: exampleTransaction.completed_at,
  amount: exampleTransaction.total_amount,
  buyerId: "ef0e9886-bd40-4403-99ea-f62ebb3a995c",
  sellerId: "99e289e8-cf01-4277-bbe2-b99b088a4166",
  caskId: "86efe4be-85e1-4f80-b9f5-8ab0d5c2900e",
  metadata: {
    platform: "Arigi",
    version: "1.0"
  }
}, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Note about current transactions */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Current System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              The transactions in your current database are still in "pending" status and haven't been 
              registered on the blockchain yet. Blockchain registration happens after admin approval 
              through the approve-transaction function.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}