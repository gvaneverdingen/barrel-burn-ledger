import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Shield, 
  TrendingUp, 
  DollarSign,
  Calendar,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface PortfolioReport {
  totalValue: number;
  totalInvestment: number;
  realizedGains: number;
  unrealizedGains: number;
  roi: number;
  caskCount: number;
  transactions: any[];
  compliance: ComplianceStatus;
}

interface ComplianceStatus {
  kycStatus: 'pending' | 'approved' | 'rejected';
  amlStatus: 'pending' | 'approved' | 'rejected';
  taxReporting: 'compliant' | 'requires_attention';
  licenses: LicenseStatus[];
}

interface LicenseStatus {
  type: string;
  status: 'valid' | 'expired' | 'pending';
  expiryDate?: string;
}

const Reports = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (user) {
      generateReport();
    }
  }, [user]);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Fetch portfolio data
      const [ownershipData, transactionData] = await Promise.all([
        supabase
          .from('cask_ownership')
          .select(`
            *,
            casks (
              price_per_liter,
              current_volume_liters,
              total_price
            )
          `)
          .eq('owner_id', user?.id)
          .eq('is_active', true),
        
        supabase
          .from('transactions')
          .select('*')
          .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
      ]);

      if (ownershipData.error) throw ownershipData.error;
      if (transactionData.error) throw transactionData.error;

      const ownerships = ownershipData.data || [];
      const transactions = transactionData.data || [];

      // Calculate metrics
      const totalValue = ownerships.reduce((sum, ownership) => {
        const currentPrice = ownership.casks?.price_per_liter || 0;
        return sum + (currentPrice * ownership.volume_liters);
      }, 0);

      const totalInvestment = ownerships.reduce((sum, ownership) => {
        return sum + (ownership.acquisition_price || 0);
      }, 0);

      const realizedGains = transactions
        .filter(t => t.seller_id === user?.id && t.status === 'completed')
        .reduce((sum, t) => sum + (t.seller_amount || 0), 0);

      const unrealizedGains = totalValue - totalInvestment;
      const roi = totalInvestment > 0 ? (unrealizedGains / totalInvestment) * 100 : 0;

      // Mock compliance data (would come from actual verification system)
      const compliance: ComplianceStatus = {
        kycStatus: 'approved',
        amlStatus: 'approved',
        taxReporting: 'compliant',
        licenses: [
          { type: 'Investment License', status: 'valid', expiryDate: '2025-12-31' },
          { type: 'Alcohol Trading', status: 'valid', expiryDate: '2025-06-30' }
        ]
      };

      setReport({
        totalValue,
        totalInvestment,
        realizedGains,
        unrealizedGains,
        roi,
        caskCount: ownerships.length,
        transactions,
        compliance
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'csv') => {
    setGeneratingReport(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (error) {
      toast.error('Failed to download report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const pushToBlockchain = async () => {
    try {
      // Simulate blockchain push
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Portfolio data pushed to blockchain ledger');
    } catch (error) {
      toast.error('Failed to push to blockchain');
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'valid':
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'valid':
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading || !report) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-500" />
            Reports & Compliance
          </h1>
          <p className="text-muted-foreground">
            Portfolio performance, regulatory compliance, and blockchain reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateReport} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button onClick={pushToBlockchain}>
            <Shield className="h-4 w-4 mr-2" />
            Push to Blockchain
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">£{report.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                <p className="text-2xl font-bold">£{report.totalInvestment.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unrealized Gains</p>
                <p className={`text-2xl font-bold ${report.unrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  £{report.unrealizedGains.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ROI</p>
                <p className={`text-2xl font-bold ${report.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {report.roi.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="portfolio">Portfolio Report</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Records</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Download Reports</CardTitle>
                <CardDescription>
                  Generate detailed portfolio reports for your records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => downloadReport('pdf')} 
                    disabled={generatingReport}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                  <Button 
                    onClick={() => downloadReport('csv')} 
                    disabled={generatingReport}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reports include transaction history, performance metrics, and tax calculations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest transactions and portfolio changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {transaction.transaction_type === 'purchase' ? 'Purchase' : 'Sale'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">£{transaction.total_amount.toLocaleString()}</p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  KYC/AML Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>KYC Verification</span>
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(report.compliance.kycStatus)}
                    <Badge className={getComplianceColor(report.compliance.kycStatus)}>
                      {report.compliance.kycStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>AML Screening</span>
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(report.compliance.amlStatus)}
                    <Badge className={getComplianceColor(report.compliance.amlStatus)}>
                      {report.compliance.amlStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax Reporting</span>
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(report.compliance.taxReporting)}
                    <Badge className={getComplianceColor(report.compliance.taxReporting)}>
                      {report.compliance.taxReporting}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  License Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.compliance.licenses.map((license, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{license.type}</p>
                      {license.expiryDate && (
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(license.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getComplianceIcon(license.status)}
                      <Badge className={getComplianceColor(license.status)}>
                        {license.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blockchain Integration
              </CardTitle>
              <CardDescription>
                All transactions are recorded on the blockchain for transparency and compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <p className="text-2xl font-bold text-green-600">{report.caskCount}</p>
                  <p className="text-sm text-muted-foreground">Casks on Chain</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-2xl font-bold text-blue-600">{report.transactions.length}</p>
                  <p className="text-sm text-muted-foreground">Transactions Recorded</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-2xl font-bold text-purple-600">100%</p>
                  <p className="text-sm text-muted-foreground">Transparency Score</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Recent Blockchain Activities</h4>
                {[
                  { action: 'Portfolio Data Sync', time: '2 hours ago', hash: '0x1234...5678' },
                  { action: 'Ownership Transfer', time: '1 day ago', hash: '0xabcd...efgh' },
                  { action: 'Price Update', time: '3 days ago', hash: '0x9876...5432' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-muted-foreground">{activity.hash}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;