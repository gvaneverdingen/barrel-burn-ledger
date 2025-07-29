import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Building2, Users, BarChart3, User, Crown, Shield, Gem, Star, Sparkles } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import arigiLogo from '@/assets/arigi-logo.png';
import warehouseHero from '@/assets/warehouse-hero.jpg';

const Index = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Allow access without authentication

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'distillery':
        return <Building2 className="h-5 w-5" />;
      case 'consumer':
      case 'investor':
        return <Users className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'distillery':
        return 'text-blue-600';
      case 'consumer':
        return 'text-green-600';
      case 'investor':
        return 'text-purple-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-dark">
        <AppSidebar />
        <main className="flex-1">
          {/* Enhanced Luxury Header */}
          <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SidebarTrigger />
                <div className="animate-float">
                  <img src={arigiLogo} alt="ARIGI Logo" className="h-8 w-8 object-contain" />
                </div>
                <h1 className="text-xl font-bold luxury-text-gradient">ARIGI</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Welcome, {user?.email}</span>
                      {userRole && (
                        <div className={`flex items-center space-x-1 ${getRoleColor(userRole)}`}>
                          {getRoleIcon(userRole)}
                          <span className="capitalize font-medium">{userRole}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => navigate('/profile')} 
                        variant="ghost" 
                        size="sm"
                        className="gap-2 hover:bg-accent/20"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Button>
                      <Button onClick={signOut} variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button onClick={() => navigate('/auth')} className="luxury-button" size="sm">
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            {/* Enhanced Luxury Hero Section */}
            <div className="relative rounded-2xl overflow-hidden mb-12 luxury-hero-bg">
              <div className="absolute inset-0">
                <img 
                  src={warehouseHero} 
                  alt="Whisky barrel warehouse" 
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/40"></div>
              </div>
              <div className="relative text-center py-32 px-8 text-foreground">
                <div className="animate-fade-in">
                  <h2 className="text-6xl font-bold mb-6 luxury-text-gradient">
                    Welcome to ARIGI
                  </h2>
                  <p className="text-xl mb-12 max-w-3xl mx-auto text-muted-foreground">
                    The blockchain-enhanced premium whisky cask investment platform crafted for the connoisseur
                  </p>
                  
                  {/* Enhanced CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button 
                      size="lg"
                      onClick={() => navigate('/marketplace')}
                      className="luxury-button text-lg px-12 py-4 animate-luxury-glow"
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Explore Marketplace
                    </Button>
                    {!user && (
                      <Button 
                        size="lg"
                        onClick={() => navigate('/auth')}
                        variant="outline"
                        className="text-lg px-12 py-4 border-primary/50 hover:bg-primary/10 hover:border-primary"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Join Elite Platform
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Role-based Dashboard Preview */}
            {user && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {userRole === 'distillery' && (
                <>
                  <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-primary">
                        <Building2 className="h-6 w-6" />
                        <span>My Distillery</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Manage your distillery profile and verification</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-gradient-copper hover:opacity-90 font-semibold" variant="outline">
                        Setup Distillery Profile
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-accent">
                        <BarChart3 className="h-6 w-6" />
                        <span>Cask Management</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Add and manage your casks on the blockchain</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-gradient-gold hover:opacity-90 font-semibold text-primary-foreground">
                        Add Casks
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-secondary">
                        <BarChart3 className="h-6 w-6" />
                        <span>Transaction History</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">View sales and transaction fees</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">
                        View Transactions
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {(userRole === 'consumer' || userRole === 'investor') && (
                <>
                  <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-primary">
                        <Crown className="h-6 w-6" />
                        <span>Browse Casks</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Explore available whisky casks for investment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full luxury-button" 
                        onClick={() => navigate('/marketplace')}
                      >
                        Browse Marketplace
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-accent">
                        <Users className="h-6 w-6" />
                        <span>My Portfolio</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Track your cask investments and ownership</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full bg-gradient-copper hover:opacity-90 font-semibold" 
                        variant="outline"
                        onClick={() => navigate('/portfolio')}
                      >
                        View Portfolio
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-secondary">
                        <Star className="h-6 w-6" />
                        <span>Investment History</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">Review your transaction history and returns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">
                        View History
                      </Button>
                    </CardContent>
                  </Card>
                </>
                )}
              </div>
            )}

            {/* Enhanced Luxury Platform Features */}
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold luxury-text-gradient mb-8">Platform Features</h3>
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Experience the pinnacle of whisky investment with our cutting-edge features
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 bg-gradient-gold rounded-full w-16 h-16 flex items-center justify-center">
                      <Shield className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-primary">Blockchain Security</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      Every cask is immutably recorded on the blockchain for transparent ownership and complete provenance tracking
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 bg-gradient-copper rounded-full w-16 h-16 flex items-center justify-center">
                      <Gem className="h-8 w-8 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl text-accent">Fair Fee Structure</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      Transparent and competitive transaction, distillery, and platform fees ensuring fair value for all participants
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-secondary to-secondary/80 rounded-full w-16 h-16 flex items-center justify-center">
                      <Crown className="h-8 w-8 text-secondary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-secondary">Premium Casks</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      Curated selection of exceptional whisky casks from verified premium distilleries worldwide
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
