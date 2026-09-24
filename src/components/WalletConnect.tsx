import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, QrCode, Copy, CheckCircle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { connectWallet, hasInjectedWallet, type Eip1193Provider } from '@/lib/walletProvider';

interface WalletConnectProps {
  onConnect?: (walletAddress: string, email?: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [busy, setBusy] = useState<null | 'walletconnect' | 'external'>(null);
  const [copied, setCopied] = useState(false);

  const saveWallet = async (addr: string, type: string) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from('wallets').select('id').eq('user_id', user.id).eq('wallet_address', addr).maybeSingle();
      if (existing) {
        await supabase.from('wallets').update({ last_used_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('wallets').update({ is_primary: false }).eq('user_id', user.id);
        await supabase.from('wallets').insert({ user_id: user.id, wallet_address: addr, wallet_type: type, is_primary: true });
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('Error saving wallet', e);
    }
  };

  const handleConnect = async (source: 'walletconnect' | 'external') => {
    setBusy(source);
    try {
      const { provider: p, address: addr } = await connectWallet(source);
      setProvider(p);
      setAddress(addr);
      await saveWallet(addr, source);
      onConnect?.(addr);
    } catch (e: any) {
      toast({ title: 'Wallet not connected', description: e?.message || 'Connection was cancelled.', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    try { await provider?.disconnect?.(); } catch { /* ignore */ }
    setProvider(null);
    setAddress(null);
  };

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Wallet Connected</CardTitle>
          <CardDescription>Your wallet is ready for USDC/USDT payments on Polygon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <code className="text-sm">{address.slice(0, 6)}…{address.slice(-4)}</code>
            <Button size="sm" variant="ghost" onClick={copy} aria-label="Copy wallet address">
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {!user && (
            <p className="text-sm text-muted-foreground">Sign in to save this wallet to your account.</p>
          )}
          <Button variant="outline" className="w-full" onClick={handleDisconnect}>Disconnect</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> WalletConnect</CardTitle>
        <CardDescription>Connect a crypto wallet to pay for casks in USDC or USDT.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" onClick={() => handleConnect('walletconnect')} disabled={!!busy}>
          <QrCode className="mr-2 h-4 w-4" />
          {busy === 'walletconnect' ? 'Opening QR code…' : 'Connect Mobile Wallet (QR)'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Works with Trust Wallet, Rainbow, MetaMask Mobile, Ledger Live and 300+ others.
        </p>
        <Button variant="outline" className="w-full" onClick={() => handleConnect('external')} disabled={!!busy}>
          <Wallet className="mr-2 h-4 w-4" />
          {busy === 'external' ? 'Connecting…' : 'Use Browser Wallet (Extension)'}
        </Button>
        <p className="text-xs text-muted-foreground">
          {hasInjectedWallet()
            ? 'A browser extension like MetaMask, Rabby, Brave or Coinbase Wallet was detected.'
            : 'No wallet extension detected — install MetaMask (metamask.io) and this button will connect to it.'}
        </p>
        <div className="flex gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          <span>A wallet is only needed for crypto payments. You still need an ARIGI account (Sign In / Sign Up) to buy casks. <Badge variant="secondary" className="ml-1">Polygon</Badge></span>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnect;
