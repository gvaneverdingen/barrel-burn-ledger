import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import arigiLogo from '@/assets/arigi-logo.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'distillery':
        return '🏭';
      case 'consumer':
      case 'investor':
        return '👤';
      case 'administrator':
        return '👑';
      default:
        return '👤';
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
      case 'administrator':
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 ml-16 transition-all duration-300">
          {/* Global Header */}
          <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-40">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="animate-float">
                  <img src={arigiLogo} alt="ARIGI Logo" className="h-8 w-8 object-contain" />
                </div>
                <h1 className="text-xl font-bold organic-text-gradient">ARIGI</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Welcome, {user?.email}</span>
                      {userRole && (
                        <div className={`flex items-center space-x-1 ${getRoleColor(userRole)}`}>
                          <span>{getRoleIcon(userRole)}</span>
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
                  <Button onClick={() => navigate('/auth')} className="organic-button" size="sm">
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
  );
};