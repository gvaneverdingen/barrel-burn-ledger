import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useMagic } from '@/contexts/MagicContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Mail, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WalletConnectProps {
  onConnect?: (walletAddress: string, email?: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const { 
    magic,
    isLoggedIn, 
    userMetadata, 
    walletAddress, 
    isLoading, 
    loginWithEmail, 
    loginWithWallet, 
    logout,
    resetLoadingState
  } = useMagic();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset connecting state on mount
  React.useEffect(() => {
    setIsConnecting(false);
  }, []);

  // Save wallet to DB when wallet address changes
  React.useEffect(() => {
    if (isLoggedIn && walletAddress && user) {
      saveWalletToDb(walletAddress, user.id);
    }
  }, [isLoggedIn, walletAddress, user]);

  const saveWalletToDb = async (address: string, userId: string) => {
    try {
      // Check if this wallet already exists for this user
      const { data: existing } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .eq('wallet_address', address)
        .maybeSingle();

      if (!existing) {
        // Set all other wallets as non-primary
        await supabase
          .from('wallets')
          .update({ is_primary: false })
          .eq('user_id', userId);

        // Insert new wallet as primary
        await supabase.from('wallets').insert({
          user_id: userId,
          wallet_address: address,
          wallet_type: 'magic',
          is_primary: true,
        });
        console.log('Wallet saved to database:', address.slice(0, 8) + '...');
      } else {
        // Update last_used_at
        await supabase
          .from('wallets')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
    } catch (error) {
      console.error('Error saving wallet to DB:', error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }

    try {
      setIsConnecting(true);
      await loginWithEmail(email);
      
      if (onConnect && walletAddress) {
        onConnect(walletAddress, email);
      }
    } catch (error) {
      // Error handling is done in loginWithEmail
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletConnect = async () => {
    try {
      setIsConnecting(true);
      await loginWithWallet();
      
      if (onConnect && walletAddress) {
        onConnect(walletAddress);
      }
    } catch (error) {
      // Error handling is done in loginWithWallet
    } finally {
      setIsConnecting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Silently fail
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoggedIn && walletAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            Your Magic wallet is connected and ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-sm bg-muted p-2 rounded">
                {truncateAddress(walletAddress)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(walletAddress)}
                className="gap-1"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {userMetadata?.email && (
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="text-sm bg-muted p-2 rounded">
                {userMetadata.email}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Network</Label>
            <Badge variant="outline">Polygon</Badge>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={logout}
              className="flex-1"
            >
              Disconnect Wallet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://polygonscan.com/address/${walletAddress}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Magic Wallet
        </CardTitle>
        <CardDescription>
          Connect with email or external wallet using Magic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Popup blocker warning */}
        <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded space-y-2">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">⚠️ Important for Magic Wallet:</p>
          <p className="text-yellow-700 dark:text-yellow-300">• Please <strong>allow popups</strong> for this site</p>
          <p className="text-yellow-700 dark:text-yellow-300">• Magic opens a popup window for authentication</p>
          <p className="text-yellow-700 dark:text-yellow-300">• If stuck on "Connecting...", check your popup blocker</p>
        </div>
        
        {/* Email Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (Passwordless)
            </Label>
            <Input
              id="magic-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isConnecting || isLoading || !email}
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Login with Email'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        {/* Wallet Connect */}
        <Button
          onClick={handleWalletConnect}
          disabled={isConnecting || isLoading}
          variant="outline"
          className="w-full"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {isConnecting ? 'Connecting...' : 'Connect External Wallet'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Passwordless authentication with email</p>
          <p>• Built-in blockchain wallet on Polygon</p>
          <p>• Connect existing MetaMask or other wallets</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnect;