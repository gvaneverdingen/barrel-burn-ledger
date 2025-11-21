import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Eye, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import angelShareLogo from '@/assets/angel-share-logo.png';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        navigate('/marketplace');
        return;
      }

      try {
        // Verify the session belongs to current user and get transaction details
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select(`
            *,
            cask:casks(
              spirit_name,
              cask_number,
              distillery:distilleries(name)
            )
          `)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (transactions && transactions.length > 0) {
          setTransaction(transactions[0]);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={angelShareLogo} alt="Angel Share Logo" className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold text-foreground heritage-title font-playfair">Angel Share</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/marketplace')}
            >
              <Package className="h-4 w-4 mr-2" />
              Marketplace
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              <CardDescription className="text-lg">
                Your whisky cask investment has been processed successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                  <p className="font-mono text-sm">{transaction?.id || sessionId}</p>
                </div>
                {transaction && (
                  <>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Cask</p>
                      <p className="font-semibold">{transaction.cask?.spirit_name}</p>
                      <p className="text-sm text-muted-foreground">#{transaction.cask?.cask_number}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                      <p className="font-semibold text-lg">
                        ${transaction.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">What happens next?</h3>
                <div className="text-left space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Your cask ownership will be recorded on the blockchain within 24 hours</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>You'll receive a confirmation email with your ownership certificate</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Access your investment portfolio to track your cask's maturation progress</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Regular updates will be provided on your cask's development and value</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button asChild className="flex-1">
                  <Link to="/marketplace">
                    <Package className="h-4 w-4 mr-2" />
                    Browse More Casks
                  </Link>
                </Button>
                {user && (
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/portfolio">
                      <Eye className="h-4 w-4 mr-2" />
                      View Portfolio
                    </Link>
                  </Button>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Need help? Contact our support team at support@angelshare.com
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;