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
    magic,
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
    console.log('🔵 WalletConnect: Email login form submitted', { email, hasEmail: !!email });
    
    if (!email) {
      console.log('🔴 WalletConnect: No email provided');
      return;
    }

    try {
      console.log('🔵 WalletConnect: Starting email login process');
      setIsConnecting(true);
      
      console.log('🔵 WalletConnect: Calling loginWithEmail');
      await loginWithEmail(email);
      
      console.log('🔵 WalletConnect: Login completed, wallet address:', walletAddress);
      if (onConnect && walletAddress) {
        console.log('🔵 WalletConnect: Calling onConnect callback');
        onConnect(walletAddress, email);
      }
    } catch (error) {
      console.error('🔴 WalletConnect: Email login failed:', error);
    } finally {
      console.log('🔵 WalletConnect: Setting connecting to false');
      setIsConnecting(false);
    }
  };

  const handleWalletConnect = async () => {
    console.log('🔵 WalletConnect: External wallet connect button clicked');
    
    try {
      console.log('🔵 WalletConnect: Starting wallet connect process');
      setIsConnecting(true);
      
      console.log('🔵 WalletConnect: Calling loginWithWallet');
      await loginWithWallet();
      
      console.log('🔵 WalletConnect: Wallet connect completed, wallet address:', walletAddress);
      if (onConnect && walletAddress) {
        console.log('🔵 WalletConnect: Calling onConnect callback');
        onConnect(walletAddress);
      }
    } catch (error) {
      console.error('🔴 WalletConnect: Wallet connect failed:', error);
    } finally {
      console.log('🔵 WalletConnect: Setting connecting to false');
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
        {/* Debug button to test clicks */}
        <Button 
          onClick={() => {
            console.log('🔵 DEBUG: Test button clicked!');
            alert('Test button works!');
          }}
          variant="secondary"
          className="w-full"
        >
          🔧 Test Click (Debug)
        </Button>
        
        {/* Magic SDK Test */}
        <Button 
          onClick={() => {
            console.log('🔵 DEBUG: Button clicked - starting Magic test');
            alert('Button click registered!');
            
            if (!magic) {
              console.log('🔴 DEBUG: Magic is null/undefined');
              alert('Magic is null - not initialized properly');
              return;
            }
            
            console.log('🔵 DEBUG: Magic exists, testing...');
            
            // Simple test without async
            try {
              console.log('🔵 DEBUG: Magic object:', typeof magic);
              console.log('🔵 DEBUG: Magic.user exists:', !!magic.user);
              alert(`Magic object type: ${typeof magic}, has user: ${!!magic.user}`);
            } catch (error) {
              console.error('🔴 DEBUG: Error accessing Magic:', error);
              alert(`Error: ${error.message}`);
            }
          }}
          variant="outline"
          className="w-full"
        >
          🧪 Simple Magic Test
        </Button>
        
        {/* Magic state debug info */}
        <div className="text-xs bg-muted p-2 rounded space-y-1">
          <p>Magic State Debug:</p>
          <p>• isLoading: {isLoading ? 'true' : 'false'}</p>
          <p>• isLoggedIn: {isLoggedIn ? 'true' : 'false'}</p>
          <p>• magic instance: {magic ? 'exists' : 'null'}</p>
          <p>• isConnecting: {isConnecting ? 'true' : 'false'}</p>
          <p>• email: "{email}"</p>
        </div>
        
        {/* Popup blocker warning */}
        <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded space-y-2">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">⚠️ Important for Magic Wallet:</p>
          <p className="text-yellow-700 dark:text-yellow-300">• Please <strong>allow popups</strong> for this site</p>
          <p className="text-yellow-700 dark:text-yellow-300">• Magic opens a popup window for authentication</p>
          <p className="text-yellow-700 dark:text-yellow-300">• If stuck on "Connecting...", check your popup blocker</p>
          <button 
            onClick={() => {
              const popup = window.open('', '_blank', 'width=500,height=600');
              if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                alert('Popups are blocked! Please allow popups for this site to use Magic wallet.');
              } else {
                popup.close();
                alert('Popups are working! Magic wallet should work now.');
              }
            }}
            className="text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
          >
            Test Popup Blocker
          </button>
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