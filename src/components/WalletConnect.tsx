import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useMagic } from '@/contexts/MagicContext';
import { Wallet, Mail, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WalletConnectProps {
  onConnect?: (walletAddress: string, email?: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const { 
    isLoggedIn, 
    userMetadata, 
    walletAddress, 
    isLoading, 
    loginWithEmail, 
    loginWithWallet, 
    logout 
  } = useMagic();
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsConnecting(true);
      await loginWithEmail(email);
      if (onConnect && walletAddress) {
        onConnect(walletAddress, email);
      }
    } catch (error) {
      console.error('Email login failed:', error);
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
      console.error('Wallet connect failed:', error);
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
      console.error('Failed to copy:', error);
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