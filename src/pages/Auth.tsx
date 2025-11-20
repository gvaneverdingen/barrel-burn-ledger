import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Grape, Building2, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { validatePasswordStrength } from '@/utils/passwordValidation';
import { authRateLimiter } from '@/utils/rateLimiting';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { user, signUp, signIn, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'distillery' | 'consumer' | 'investor' | ''>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [lastResetTime, setLastResetTime] = useState<number>(0);
  const [resetCooldown, setResetCooldown] = useState<number>(0);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check client-side cooldown (60 seconds)
    const now = Date.now();
    const timeSinceLastReset = now - lastResetTime;
    const cooldownPeriod = 60000; // 60 seconds
    
    if (timeSinceLastReset < cooldownPeriod) {
      const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastReset) / 1000);
      toast({
        title: "Please Wait",
        description: `You can request another reset link in ${remainingSeconds} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Handle rate limiting error from Supabase
        if (error.message.includes('security purposes') || error.message.includes('rate limit')) {
          toast({
            title: "Too Many Requests",
            description: "Please wait a minute before requesting another password reset link.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Update last reset time
        setLastResetTime(now);
        
        toast({
          title: "Reset Email Sent",
          description: "Check your email for a password reset link. It may take a few minutes to arrive.",
        });
        setShowForgotPassword(false);
        setResetEmail('');
        
        // Start cooldown timer
        setResetCooldown(60);
        const interval = setInterval(() => {
          setResetCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
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
            <h1 className="text-3xl font-bold text-foreground heritage-title font-playfair">Angel Share</h1>
          </div>
          <p className="text-muted-foreground">Premium whisky cask investment platform</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="wallet">Magic Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your Angel Share account</CardDescription>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="px-0 text-xs h-auto">
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleForgotPassword}>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input
                                  id="reset-email"
                                  type="email"
                                  placeholder="your@email.com"
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                disabled={isResetting || resetCooldown > 0}
                              >
                                {isResetting 
                                  ? 'Sending...' 
                                  : resetCooldown > 0 
                                    ? `Wait ${resetCooldown}s` 
                                    : 'Send Reset Link'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
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
                <CardDescription>Join the Angel Share platform</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Select name="role" required onValueChange={(value) => setSelectedRole(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distillery">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                            <div>
                              <div className="font-medium">Distillery</div>
                              <div className="text-xs text-muted-foreground">Sell casks & manage inventory</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="consumer">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-green-600" />
                            <div>
                              <div className="font-medium">Consumer</div>
                              <div className="text-xs text-muted-foreground">Browse & purchase casks</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="investor">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-purple-600" />
                            <div>
                              <div className="font-medium">Investor</div>
                              <div className="text-xs text-muted-foreground">Advanced trading & analytics</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedRole === 'distillery' && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-900">Welcome, Distillery!</p>
                            <p className="text-blue-700">You'll get access to cask management, sales analytics, and verification tools.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedRole === 'consumer' && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Users className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-green-900">Welcome, Consumer!</p>
                            <p className="text-green-700">Browse and purchase premium whisky casks from verified distilleries.</p>
                          </div>
                        </div>
                      </div>
                    )}
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
                    <Label htmlFor="companyName">
                      Company Name 
                      {selectedRole === 'distillery' && <span className="text-red-500">*</span>}
                      <span className="text-muted-foreground text-sm ml-1">
                        {selectedRole === 'distillery' ? '(Required)' : '(Optional for non-distilleries)'}
                      </span>
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder={selectedRole === 'distillery' ? "e.g., Macallan Distillery, Glenfiddich, etc." : "Company or Organization (optional)"}
                      required={selectedRole === 'distillery'}
                    />
                    {selectedRole === 'distillery' && (
                      <p className="text-xs text-muted-foreground">
                        This will be displayed publicly on your cask listings and must be verified
                      </p>
                    )}
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