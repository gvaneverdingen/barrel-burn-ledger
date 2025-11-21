import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Eye, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import angelShareLogo from '@/assets/angel-share-logo.png';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !user) {
        setError('Missing payment information');
        setVerifying(false);
        return;
      }

      try {
        // Give webhook a moment to process if needed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify payment by checking transaction status
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select(`
            *,
            cask:casks(
              spirit_name,
              cask_number,
              distillery:distilleries(name)
            )
          `)
          .eq('buyer_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);

        if (txError) throw txError;

        if (transactions && transactions.length > 0) {
          setTransactionDetails(transactions[0]);
          setVerified(true);
          
          // Verify ownership was created
          const { data: ownership, error: ownershipError } = await supabase
            .from('cask_ownership')
            .select('id')
            .eq('cask_id', transactions[0].cask_id)
            .eq('owner_id', user.id)
            .single();
            
          if (ownershipError || !ownership) {
            console.warn('Ownership record not found yet, but transaction is completed');
          }
        } else {
          setError('Payment verification in progress. Please check your portfolio in a few minutes.');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Unable to verify payment. Please contact support if this issue persists.');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, user]);

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
          {verifying ? (
            <Card className="text-center py-12">
              <CardContent>
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-muted-foreground">Verifying your payment...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="text-center">
              <CardHeader className="pb-4">
                <div className="mx-auto mb-4">
                  <AlertCircle className="h-16 w-16 text-orange-600 mx-auto" />
                </div>
                <CardTitle className="text-2xl text-orange-600">Verification Pending</CardTitle>
                <CardDescription className="text-lg">{error}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 pt-6">
                  <Button asChild>
                    <Link to="/portfolio">
                      <Eye className="h-4 w-4 mr-2" />
                      View Portfolio
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/marketplace">
                      <Package className="h-4 w-4 mr-2" />
                      Back to Marketplace
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                {transactionDetails && (
                  <div className="bg-muted p-4 rounded-lg text-left">
                    <h3 className="font-semibold mb-3">Purchase Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cask:</span>
                        <span className="font-medium">{transactionDetails.cask?.spirit_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cask Number:</span>
                        <span className="font-medium">{transactionDetails.cask?.cask_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distillery:</span>
                        <span className="font-medium">{transactionDetails.cask?.distillery?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volume:</span>
                        <span className="font-medium">{transactionDetails.volume_liters}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount Paid:</span>
                        <span className="font-medium">${transactionDetails.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Stripe Session ID</p>
                  <p className="font-mono text-xs break-all">{sessionId}</p>
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
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;