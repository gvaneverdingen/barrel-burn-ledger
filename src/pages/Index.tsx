import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Building2, Users, BarChart3, User, Crown, Shield, Gem, Star, Sparkles, Link2, FileText, TrendingUp, Eye } from 'lucide-react';
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
    <div className="bg-gradient-dark">
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

        {/* Platform Concept & Vision */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold luxury-text-gradient mb-6">Revolutionizing Whisky Investment</h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              ARIGI bridges the gap between traditional whisky craftsmanship and modern blockchain technology, 
              creating the world's first comprehensive platform for single malt cask investment and ownership verification.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left Column - Our Vision */}
            <div className="space-y-8">
              <Card className="luxury-card animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center gap-3 mb-4">
                    <TrendingUp className="h-8 w-8" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    We envision a world where whisky cask investment is accessible, transparent, and secure for both 
                    seasoned collectors and newcomers to the market. Our platform democratizes access to premium single 
                    malt investments while maintaining the highest standards of authenticity and provenance.
                  </p>
                  <p>
                    By leveraging blockchain technology, we ensure that every barrel's existence is verified, 
                    ownership is crystal clear, and the complete history of each cask is immutably preserved 
                    for future generations of whisky enthusiasts.
                  </p>
                </CardContent>
              </Card>

              <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.1s'}}>
                <CardHeader>
                  <CardTitle className="text-2xl text-accent flex items-center gap-3 mb-4">
                    <Link2 className="h-8 w-8" />
                    Connecting Investors & Distilleries
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    ARIGI serves as the premium bridge connecting passionate investors with world-renowned distilleries. 
                    Our platform enables distilleries to showcase their finest casks while providing investors with 
                    unprecedented access to exceptional single malt opportunities.
                  </p>
                  <p>
                    Through our verification system, distilleries gain complete visibility into cask ownership, 
                    enabling better relationships with their investors and enhanced tracking of their premium products 
                    throughout the maturation and investment lifecycle.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Key Features */}
            <div className="space-y-8">
              <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.2s'}}>
                <CardHeader>
                  <CardTitle className="text-2xl text-secondary flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8" />
                    Blockchain-Verified Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Every cask on our platform is backed by blockchain technology, ensuring that all barrels 
                    genuinely exist and are properly documented. This revolutionary approach eliminates fraud 
                    and provides investors with complete confidence in their acquisitions.
                  </p>
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">Ownership Benefits:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Immutable ownership records</li>
                      <li>• Clear title verification</li>
                      <li>• Transparent transaction history</li>
                      <li>• Instant ownership transfers</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="luxury-card animate-fade-in" style={{animationDelay: '0.3s'}}>
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center gap-3 mb-4">
                    <FileText className="h-8 w-8" />
                    Complete Cask History & Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Access comprehensive information about each cask including its complete ownership history, 
                    distillation details, maturation progress, and tasting notes. Our platform maintains 
                    detailed records that enhance both investment decisions and collecting experiences.
                  </p>
                  <div className="bg-gradient-to-r from-accent/10 to-secondary/10 rounded-lg p-4 border border-accent/20">
                    <h4 className="font-semibold text-accent mb-2">Detailed Information:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Previous ownership chain</li>
                      <li>• Distillation & maturation data</li>
                      <li>• Current volume & alcohol content</li>
                      <li>• Professional tasting notes</li>
                      <li>• Investment performance metrics</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="text-center mb-12">
            <h4 className="text-3xl font-bold luxury-text-gradient mb-8">How ARIGI Works</h4>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full w-16 h-16 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg text-primary mb-2">1. Distillery Verification</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Premium distilleries register and verify their credentials, ensuring only authentic producers 
                    can list casks on our platform.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-accent to-accent/80 rounded-full w-16 h-16 flex items-center justify-center">
                    <Link2 className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-lg text-accent mb-2">2. Blockchain Registration</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Each cask is registered on the blockchain with comprehensive details, creating an 
                    immutable record of its existence and characteristics.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-secondary to-secondary/80 rounded-full w-16 h-16 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-lg text-secondary mb-2">3. Transparent Investment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Investors can browse, analyze, and purchase cask shares with complete visibility into 
                    ownership history, cask details, and investment potential.
                  </CardDescription>
                </CardHeader>
              </Card>
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
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    View Analytics
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
                      <BarChart3 className="h-6 w-6" />
                      <span>My Portfolio</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Track your cask investments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full luxury-button" 
                      onClick={() => navigate('/portfolio')}
                    >
                      View Portfolio
                    </Button>
                  </CardContent>
                </Card>

                <Card className="luxury-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-accent">
                      <User className="h-6 w-6" />
                      <span>My Profile</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Manage your investment profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => navigate('/profile')}
                    >
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Additional user-specific features */}
        {user && userRole === 'consumer' && (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to explore premium whisky cask investments?
            </p>
            <Button 
              onClick={() => navigate('/marketplace')} 
              size="lg"
              className="luxury-button px-8 py-3"
            >
              <Crown className="mr-2 h-5 w-5" />
              Browse Marketplace
            </Button>
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
    </div>
  );
};

export default Index;