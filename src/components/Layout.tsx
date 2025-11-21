import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { ComparisonButton } from '@/components/ComparisonButton';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CurrencySelector } from '@/components/CurrencySelector';
import angelShareLogo from '@/assets/angel-share-logo.png';

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
      <main className="flex-1 ml-0 lg:ml-16 transition-all duration-300 pb-16 lg:pb-0">
          {/* Mobile-Optimized Global Header */}
          <header className="mobile-sticky-header h-14 sm:h-16 border-b border-border/50 bg-card/80 backdrop-blur-md">
            <div className="mobile-container h-full flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="animate-float shrink-0">
                  <img src={angelShareLogo} alt="Angel Share Logo" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
                </div>
                <h1 className="text-base sm:text-xl font-bold heritage-title font-playfair truncate">Angel Share</h1>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <CurrencySelector />
                {user ? (
                  <>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="truncate max-w-[150px]">Welcome, {user?.email}</span>
                      {userRole && (
                        <div className={`flex items-center space-x-1 ${getRoleColor(userRole)}`}>
                          <span>{getRoleIcon(userRole)}</span>
                          <span className="capitalize font-medium">{userRole}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button 
                        onClick={() => navigate('/profile')} 
                        variant="ghost" 
                        size="sm"
                        className="gap-1 sm:gap-2 hover:bg-accent/20 mobile-touch-target px-2 sm:px-4"
                      >
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Profile</span>
                      </Button>
                      <Button onClick={signOut} variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10 mobile-touch-target px-2 sm:px-4">
                        <LogOut className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Sign Out</span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button onClick={() => navigate('/auth')} className="heritage-button mobile-button-md" size="sm">
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
          
          <ComparisonButton />
          <MobileBottomNav />
        </main>
      </div>
  );
};