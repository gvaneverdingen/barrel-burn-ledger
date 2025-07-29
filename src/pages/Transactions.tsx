import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Transactions = () => {
  const { user } = useAuth();

  const transactions = [
    {
      id: "TXN-001",
      date: "2024-01-15",
      type: "Purchase",
      description: "Highland Single Malt - Cask #HM2024",
      amount: "£15,000.00",
      status: "Completed",
      method: "Bank Transfer",
    },
    {
      id: "TXN-002",
      date: "2024-01-10",
      type: "Storage Fee",
      description: "Q1 2024 Storage & Insurance",
      amount: "£250.00",
      status: "Completed",
      method: "Card Payment",
    },
    {
      id: "TXN-003",
      date: "2024-01-05",
      type: "Sale",
      description: "Speyside Single Malt - Cask #SM2023",
      amount: "£18,500.00",
      status: "Pending",
      method: "Bank Transfer",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
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
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.date}</TableCell>
                      <TableCell>{transaction.type}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="font-mono">{transaction.amount}</TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
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
                <p className="text-2xl font-bold">£15,250.00</p>
                <p className="text-sm text-muted-foreground">This year</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">£18,500.00</p>
                <p className="text-sm text-muted-foreground">This year</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Transaction</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Transactions;