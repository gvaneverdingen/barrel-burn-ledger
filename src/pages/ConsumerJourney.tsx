import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowRight, Users, Search, ShoppingCart, Wallet, Shield, FileText, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react';

const ConsumerJourney = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-dark">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SidebarTrigger />
                <h1 className="text-xl font-bold luxury-text-gradient">Consumer Journey</h1>
              </div>
              <Button onClick={() => navigate('/marketplace')} className="luxury-button">
                Get Started
              </Button>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold luxury-text-gradient mb-4">Your Journey to Whisky Cask Investment</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Discover how ARIGI transforms traditional whisky cask investment through blockchain technology, 
                creating a seamless experience from registration to resale.
              </p>
            </div>

            {/* Interactive Journey Steps */}
            <div className="space-y-8">
              {/* Step 1: Website & Sign-up */}
              <div className="relative">
                <Card className="luxury-card animate-fade-in">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-full">
                        <Users className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-primary">1. Website & Sign-up</CardTitle>
                        <CardDescription>Join the ARIGI platform and create your investor profile</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center p-4 border border-border/50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-primary">Welcome to ARIGI</h4>
                        <p className="text-sm text-muted-foreground">Discover premium whisky cask investment opportunities</p>
                      </div>
                      <div className="text-center p-4 border border-border/50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-accent">Create Account</h4>
                        <p className="text-sm text-muted-foreground">Sign up with email or connect your wallet</p>
                      </div>
                      <div className="text-center p-4 border border-border/50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-secondary">Complete Profile</h4>
                        <p className="text-sm text-muted-foreground">Wallet connection, identity verification, set preferences</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <ArrowRight className="h-8 w-8 text-primary rotate-90" />
                </div>
              </div>

              {/* Step 2: Marketplace */}
              <div className="relative">
                <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-accent to-accent/80 rounded-full">
                        <Search className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-accent">2. Marketplace Discovery</CardTitle>
                        <CardDescription>Explore and analyze premium cask investment opportunities</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-accent">Browse & Search</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Filter by distillery, age, region</li>
                          <li>• View detailed cask information</li>
                          <li>• Compare investment opportunities</li>
                          <li>• Access professional tasting notes</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-secondary">Smart Features</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• AI-powered matchmaking suggestions</li>
                          <li>• Real-time market analytics</li>
                          <li>• Investment performance tracking</li>
                          <li>• Pricing transparency tools</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <ArrowRight className="h-8 w-8 text-accent rotate-90" />
                </div>
              </div>

              {/* Step 3: Purchase Process */}
              <div className="relative">
                <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-secondary to-secondary/80 rounded-full">
                        <ShoppingCart className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-secondary">3. Secure Purchase</CardTitle>
                        <CardDescription>Complete your cask investment with confidence</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-3 border border-border/50 rounded-lg">
                        <h5 className="font-semibold text-sm mb-1">Select Volume</h5>
                        <p className="text-xs text-muted-foreground">Choose your investment size</p>
                      </div>
                      <div className="text-center p-3 border border-border/50 rounded-lg">
                        <h5 className="font-semibold text-sm mb-1">Price per LPA</h5>
                        <p className="text-xs text-muted-foreground">Transparent pricing</p>
                      </div>
                      <div className="text-center p-3 border border-border/50 rounded-lg">
                        <h5 className="font-semibold text-sm mb-1">Payment</h5>
                        <p className="text-xs text-muted-foreground">Secure processing</p>
                      </div>
                      <div className="text-center p-3 border border-border/50 rounded-lg">
                        <h5 className="font-semibold text-sm mb-1">Confirmation</h5>
                        <p className="text-xs text-muted-foreground">Instant ownership</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <ArrowRight className="h-8 w-8 text-secondary rotate-90" />
                </div>
              </div>

              {/* Step 4: Blockchain & Wallet */}
              <div className="relative">
                <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-full">
                        <Wallet className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          4. Blockchain Registration
                        </CardTitle>
                        <CardDescription>Your ownership is secured on the blockchain</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
                        <h4 className="font-semibold mb-2">Digital Asset Creation</h4>
                        <p className="text-sm text-muted-foreground">Your cask becomes an NFT with immutable ownership records</p>
                      </div>
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-accent mx-auto mb-3" />
                        <h4 className="font-semibold mb-2">Transparency</h4>
                        <p className="text-sm text-muted-foreground">Complete ownership history and authenticity verification</p>
                      </div>
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-3" />
                        <h4 className="font-semibold mb-2">Portfolio Addition</h4>
                        <p className="text-sm text-muted-foreground">Asset appears in your digital wallet and portfolio</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <ArrowRight className="h-8 w-8 text-primary rotate-90" />
                </div>
              </div>

              {/* Step 5: Resale & Management */}
              <div className="relative">
                <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.4s'}}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-secondary to-primary rounded-full">
                        <RefreshCw className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-secondary">5. Resale & Investment Management</CardTitle>
                        <CardDescription>Manage and potentially resell your cask investments</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-secondary">Investment Options</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Hold for long-term appreciation</li>
                          <li>• List for resale on marketplace</li>
                          <li>• Set competitive pricing per LPA</li>
                          <li>• Track market performance</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-primary">Resale Features</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Transparent commission structure</li>
                          <li>• Automated pricing suggestions</li>
                          <li>• Instant ownership transfer</li>
                          <li>• Performance analytics</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <ArrowRight className="h-8 w-8 text-secondary rotate-90" />
                </div>
              </div>

              {/* Step 6: Legal & Compliance */}
              <div>
                <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.5s'}}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-accent to-secondary rounded-full">
                        <Shield className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-accent">6. Legal & Compliance Automation</CardTitle>
                        <CardDescription>Automated legal processes ensure regulatory compliance</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border border-border/50 rounded-lg">
                        <h5 className="font-semibold mb-2">Ownership Verification</h5>
                        <p className="text-xs text-muted-foreground">Automated title checks and validation</p>
                      </div>
                      <div className="text-center p-4 border border-border/50 rounded-lg">
                        <h5 className="font-semibold mb-2">License Compliance</h5>
                        <p className="text-xs text-muted-foreground">Alcohol regulation adherence</p>
                      </div>
                      <div className="text-center p-4 border border-border/50 rounded-lg">
                        <h5 className="font-semibold mb-2">Smart Contracts</h5>
                        <p className="text-xs text-muted-foreground">Automated transfer execution</p>
                      </div>
                      <div className="text-center p-4 border border-border/50 rounded-lg">
                        <h5 className="font-semibold mb-2">Documentation</h5>
                        <p className="text-xs text-muted-foreground">Auto-generated contracts and records</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Card className="luxury-card max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl luxury-text-gradient">Ready to Start Your Journey?</CardTitle>
                  <CardDescription>
                    Join thousands of investors who trust ARIGI for their premium whisky cask investments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg"
                      onClick={() => navigate('/marketplace')}
                      className="luxury-button"
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Explore Marketplace
                    </Button>
                    <Button 
                      size="lg"
                      onClick={() => navigate('/auth')}
                      variant="outline"
                      className="border-primary/50 hover:bg-primary/10"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Create Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ConsumerJourney;