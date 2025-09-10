import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Grape, Building2, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { validatePasswordStrength } from '@/utils/passwordValidation';
import { authRateLimiter } from '@/utils/rateLimiting';

const Auth = () => {
  const { user, signUp, signIn, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as 'distillery' | 'consumer' | 'investor';
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const companyName = formData.get('companyName') as string;

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      toast({
        title: "Password Too Weak",
        description: "Please create a stronger password following the guidelines below.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    await signUp(email, password, role, {
      firstName,
      lastName,
      companyName: role === 'distillery' ? companyName : undefined,
    });

    setIsSubmitting(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Rate limiting check
    if (!authRateLimiter.isAllowed(email)) {
      const remaining = authRateLimiter.getRemainingTime(email);
      const minutes = Math.ceil(remaining / (1000 * 60));
      
      toast({
        title: "Too Many Attempts", 
        description: `Please wait ${minutes} minute(s) before trying again.`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const result = await signIn(email, password);
    
    // Reset rate limit on successful login
    if (!result?.error) {
      authRateLimiter.reset(email);
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <Link 
            to="/marketplace" 
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Grape className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-foreground">ARIGI</h1>
          </div>
          <p className="text-muted-foreground">Premium whisky cask investment platform</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            {/* Magic Wallet temporarily disabled - invalid API key */}
            {/* <TabsTrigger value="wallet">Magic Wallet</TabsTrigger> */}
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your ARIGI account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join the ARIGI platform</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Select name="role" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distillery">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2" />
                            Distillery
                          </div>
                        </SelectItem>
                        <SelectItem value="consumer">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Consumer
                          </div>
                        </SelectItem>
                        <SelectItem value="investor">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Investor
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name (Distilleries only)</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Your Distillery Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      minLength={8}
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (!passwordTouched) setPasswordTouched(true);
                      }}
                    />
                    {passwordTouched && (
                      <PasswordStrengthIndicator 
                        password={signUpPassword}
                        showFeedback={true}
                      />
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <WalletConnect 
              onConnect={(walletAddress, email) => {
                toast({
                  title: "Wallet Connected",
                  description: "Magic wallet connected successfully! You can now use blockchain features.",
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;