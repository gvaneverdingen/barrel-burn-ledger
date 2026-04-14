import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { ComparisonButton } from '@/components/ComparisonButton';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CurrencySelector } from '@/components/CurrencySelector';
import { NotificationsBell } from '@/components/NotificationsBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import angelShareLogo from '@/assets/angel-share-logo.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

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

  // Global handler: if Stripe sends us back with a session_id on any route,
  // redirect to the dedicated payment verification page.
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    console.log('Layout payment redirect check', {
      pathname: location.pathname,
      search: location.search,
      sessionId,
      referrer,
    });

    if (sessionId && location.pathname !== '/payment-success') {
      console.log('Redirecting to /payment-success with session_id from URL');
      navigate(`/payment-success?session_id=${encodeURIComponent(sessionId)}`, { replace: true });
      return;
    }

    // If we just came back from Stripe checkout without a session_id,
    // detect the Stripe referrer and send the user to verification.
    if (!sessionId && location.pathname === '/' && referrer.includes('checkout.stripe.com')) {
      console.log('Detected Stripe referrer, redirecting to /payment-success without session_id');
      navigate('/payment-success', { replace: true });
      return;
    }

    // Fallback: if we recently initiated a payment but Stripe did not include
    // a session_id in the URL, send the user to the verification page once.
    if (location.pathname === '/') {
      try {
        const raw = localStorage.getItem('arigi_pending_payment');
        console.log('Pending payment marker on / route:', raw);

        if (raw) {
          const marker = JSON.parse(raw) as { caskId?: string; createdAt?: number };
          const createdAt = marker?.createdAt ?? 0;
          const FIFTEEN_MINUTES = 15 * 60 * 1000;

          if (Date.now() - createdAt < FIFTEEN_MINUTES) {
            console.log('Recent pending payment detected, redirecting to /payment-success');
            localStorage.removeItem('arigi_pending_payment');
            navigate('/payment-success', { replace: true });
          } else {
            console.log('Pending payment marker expired, clearing');
            localStorage.removeItem('arigi_pending_payment');
          }
        }
      } catch (e) {
        console.warn('Error handling pending payment marker', e);
      }
    }
  }, [searchParams, location.pathname, location.search, navigate]);

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
                <ThemeToggle />
                <CurrencySelector />
                <NotificationsBell />
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