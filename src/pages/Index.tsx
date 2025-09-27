import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Building2, Users, BarChart3, User, Crown, Shield, Gem, Star, Sparkles, Link2, FileText, TrendingUp, Eye } from 'lucide-react';
import warehouseHero from '@/assets/warehouse-hero.jpg';
import angelShareLogo from '@/assets/angel-share-horizontal-logo.png';

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
        <div className="relative rounded-2xl overflow-hidden mb-12 heritage-hero-bg">
          <div className="absolute inset-0">
            <img 
              src={warehouseHero} 
              alt="Whisky barrel warehouse" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/60"></div>
          </div>
          <div className="relative text-center py-32 px-8 text-foreground">
            <div className="animate-fade-in">
              <h2 className="text-6xl font-bold mb-6 heritage-title font-playfair">
                Welcome to Angel Share
              </h2>
              <p className="text-xl mb-12 max-w-3xl mx-auto heritage-body">
                The blockchain-enhanced premium whisky cask investment platform where heritage meets innovation
              </p>
              
              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg"
                  onClick={() => navigate('/marketplace')}
                  className="heritage-button-buy text-lg px-12 py-4 animate-luxury-glow"
                >
                  <Crown className="mr-2 h-5 w-5" />
                  Explore Marketplace
                </Button>
                {!user && (
                  <Button 
                    size="lg"
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="text-lg px-12 py-4 border-primary/50 hover:bg-primary/10 hover:border-primary font-inter"
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
        <div className="mb-20 heritage-section-bg py-16 px-8 rounded-2xl">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold heritage-title mb-6 font-playfair">Revolutionizing Whisky Investment</h3>
            <p className="text-xl heritage-body max-w-4xl mx-auto leading-relaxed">
              Angel Share bridges the gap between traditional whisky craftsmanship and modern blockchain technology, 
              creating the world's first comprehensive platform for single malt cask investment and ownership verification.
            </p>
          </div>

          {/* Enhanced Vision Cards - Symmetric Expandable Layout */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Blockchain-Verified Ownership */}
            <Card className="heritage-card animate-fade-in group cursor-pointer h-fit transition-all duration-500 hover:scale-[1.02]" style={{animationDelay: '0.1s'}}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-secondary to-secondary/80 rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-heritage">
                  <Shield className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-2xl text-secondary mb-2 font-bold font-playfair">
                  Blockchain-Verified Ownership
                </CardTitle>
                <CardDescription className="heritage-body text-base">
                  Revolutionary technology ensuring authentic cask ownership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="heritage-body leading-relaxed text-center">
                  Every cask is backed by blockchain technology, eliminating fraud and providing complete confidence.
                </p>
                
                {/* Expandable Content */}
                <div className="overflow-hidden transition-all duration-500 max-h-0 group-hover:max-h-96 group-hover:opacity-100 opacity-0">
                  <div className="pt-4 space-y-4">
                    <div className="bg-gradient-to-r from-secondary/10 to-accent/10 rounded-lg p-4 border border-secondary/20">
                      <h4 className="font-semibold text-secondary mb-3 flex items-center gap-2 font-inter">
                        <Gem className="h-4 w-4" />
                        Ownership Benefits:
                      </h4>
                      <ul className="space-y-2 text-sm heritage-body">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                          Immutable ownership records
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                          Clear title verification
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                          Transparent transaction history
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                          Instant ownership transfers
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-secondary/50 text-secondary hover:bg-secondary/10 font-inter"
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complete Cask History & Details */}
            <Card className="organic-card animate-fade-in group cursor-pointer h-fit transition-all duration-500 hover:scale-[1.02]" style={{animationDelay: '0.2s'}}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <FileText className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl text-primary mb-2 font-bold">
                  Complete Cask History & Details
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Comprehensive records enhancing investment decisions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed text-center">
                  Access detailed information about ownership history, distillation, and maturation progress.
                </p>
                
                {/* Expandable Content */}
                <div className="overflow-hidden transition-all duration-500 max-h-0 group-hover:max-h-96 group-hover:opacity-100 opacity-0">
                  <div className="pt-4 space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                      <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Detailed Information:
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Previous ownership chain
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Distillation & maturation data
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Current volume & alcohol content
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Professional tasting notes
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Investment performance metrics
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        Explore Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connecting Investors & Distilleries */}
            <Card className="organic-card animate-fade-in group cursor-pointer h-fit transition-all duration-500 hover:scale-[1.02]" style={{animationDelay: '0.3s'}}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-accent to-accent/80 rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Link2 className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl text-accent mb-2 font-bold">
                  Connecting Investors & Distilleries
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Premium bridge between passionate investors and renowned distilleries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed text-center">
                  Enabling distilleries to showcase finest casks while providing unprecedented access to investments.
                </p>
                
                {/* Expandable Content */}
                <div className="overflow-hidden transition-all duration-500 max-h-0 group-hover:max-h-96 group-hover:opacity-100 opacity-0">
                  <div className="pt-4 space-y-4">
                    <div className="bg-gradient-to-r from-accent/10 to-secondary/10 rounded-lg p-4 border border-accent/20">
                      <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Connection Benefits:
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          Direct distillery partnerships
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          Verified premium cask access
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          Enhanced tracking visibility
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          Investment lifecycle management
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-accent/50 text-accent hover:bg-accent/10"
                      >
                        Join Network
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Our Vision */}
            <Card className="organic-card animate-fade-in group cursor-pointer h-fit transition-all duration-500 hover:scale-[1.02]" style={{animationDelay: '0.4s'}}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary to-accent rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <TrendingUp className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl text-primary mb-2 font-bold">
                  Our Vision
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Democratizing whisky investment with transparency and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed text-center">
                  Making whisky cask investment accessible for both seasoned collectors and newcomers.
                </p>
                
                {/* Expandable Content */}
                <div className="overflow-hidden transition-all duration-500 max-h-0 group-hover:max-h-96 group-hover:opacity-100 opacity-0">
                  <div className="pt-4 space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
                      <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Vision Goals:
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Accessible premium investments
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Highest authenticity standards
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Preserved heritage for future generations
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Transparent market ecosystem
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        Discover Vision
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        <div className="mb-20 heritage-section-bg py-16 px-8 rounded-2xl">
          <div className="text-center mb-12">
            <h4 className="text-3xl font-bold heritage-title mb-8 font-playfair">How Angel Share Works</h4>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="heritage-card animate-fade-in group hover:scale-105 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full w-16 h-16 flex items-center justify-center shadow-gold">
                    <Building2 className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg text-primary mb-2 font-playfair">1. Distillery Verification</CardTitle>
                  <CardDescription className="heritage-body">
                    Premium distilleries register and verify their credentials, ensuring only authentic producers 
                    can list casks on our platform.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="heritage-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-accent to-accent/80 rounded-full w-16 h-16 flex items-center justify-center shadow-heritage">
                    <Link2 className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-lg text-accent mb-2 font-playfair">2. Blockchain Registration</CardTitle>
                  <CardDescription className="heritage-body">
                    Each cask is registered on the blockchain with comprehensive details, creating an 
                    immutable record of its existence and characteristics.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="heritage-card animate-fade-in group hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-secondary to-secondary/80 rounded-full w-16 h-16 flex items-center justify-center shadow-heritage">
                    <Eye className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-lg text-secondary mb-2 font-playfair">3. Transparent Investment</CardTitle>
                  <CardDescription className="heritage-body">
                    Investors can browse, analyze, and purchase cask shares with complete visibility into 
                    ownership history, cask details, and investment potential.
                  </CardDescription>
                </CardHeader>
              </Card>
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