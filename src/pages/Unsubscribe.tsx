import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailX, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
        { headers: { apikey: anonKey } }
      );
      const data = await res.json();
      if (res.ok && data.valid === true) {
        setStatus('valid');
      } else if (data.reason === 'already_unsubscribed') {
        setStatus('already_unsubscribed');
      } else {
        setStatus('invalid');
      }
    } catch {
      setStatus('invalid');
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus('success');
      } else if (data?.reason === 'already_unsubscribed') {
        setStatus('already_unsubscribed');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <p className="text-sm font-bold tracking-[3px] text-primary uppercase mb-4">ARIGI</p>
          <CardTitle className="text-2xl">Email Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="py-8">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Verifying your request...</p>
            </div>
          )}

          {status === 'valid' && (
            <div className="py-4 space-y-4">
              <MailX className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Click below to unsubscribe from app emails. You'll still receive
                important account-related notifications.
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                variant="destructive"
                className="w-full"
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  'Confirm Unsubscribe'
                )}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4 space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <p className="font-semibold text-lg">You've been unsubscribed</p>
              <p className="text-muted-foreground text-sm">
                You won't receive any more app emails from ARIGI.
              </p>
            </div>
          )}

          {status === 'already_unsubscribed' && (
            <div className="py-4 space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="font-semibold text-lg">Already unsubscribed</p>
              <p className="text-muted-foreground text-sm">
                You've already unsubscribed from app emails.
              </p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="py-4 space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="font-semibold text-lg">Invalid link</p>
              <p className="text-muted-foreground text-sm">
                This unsubscribe link is invalid or has expired.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="font-semibold text-lg">Something went wrong</p>
              <p className="text-muted-foreground text-sm">
                We couldn't process your request. Please try again later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
