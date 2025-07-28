import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Grape, LogOut, Building2, Users, BarChart3, User } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grape className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">ARIGI</h1>
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
                    className="gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                  <Button onClick={signOut} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="default" size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Welcome to ARIGI
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            The blockchain-enhanced premium whisky cask investment platform
          </p>
        </div>

        {/* Role-based Dashboard Preview */}
        {user && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {userRole === 'distillery' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>My Distillery</span>
                  </CardTitle>
                  <CardDescription>Manage your distillery profile and verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Setup Distillery Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Cask Management</span>
                  </CardTitle>
                  <CardDescription>Add and manage your casks on the blockchain</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Add Casks
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Transaction History</span>
                  </CardTitle>
                  <CardDescription>View sales and transaction fees</CardDescription>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Browse Casks</span>
                  </CardTitle>
                  <CardDescription>Explore available whisky casks for investment</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate('/marketplace')}
                  >
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>My Portfolio</span>
                  </CardTitle>
                  <CardDescription>Track your cask investments and ownership</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    View Portfolio
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Investment History</span>
                  </CardTitle>
                  <CardDescription>Review your transaction history and returns</CardDescription>
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

        {/* Platform Features */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-6">Platform Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Security</CardTitle>
                <CardDescription>
                  Every cask is coded into the blockchain for transparent ownership and provenance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fair Fee Structure</CardTitle>
                <CardDescription>
                  Transparent transaction, distillery, and platform fees for all participants
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Premium Casks</CardTitle>
                <CardDescription>
                  Curated selection of premium whisky casks from verified distilleries
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
