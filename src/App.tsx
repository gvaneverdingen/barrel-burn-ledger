import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MagicProvider } from "@/contexts/MagicContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupResizeObserverErrorHandler } from "@/utils/resizeObserver";
import { Layout } from "@/components/Layout";
import ProfileCompletion from "@/components/ProfileCompletion";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Marketplace from "./pages/Marketplace";
import Wishlist from "./pages/Wishlist";
import Comparison from "./pages/Comparison";
import Reports from "./pages/Reports";
import CaskDetails from "./pages/CaskDetails";
import Profile from "./pages/Profile";
import Portfolio from "./pages/Portfolio";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/admin/Dashboard";
import TestData from "./pages/TestData";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import Insights from "./pages/Insights";
import Notifications from "./pages/Notifications";
import Transactions from "./pages/Transactions";
import Documentation from "./pages/Documentation";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import ConsumerJourney from "./pages/ConsumerJourney";
import RoleBasedRoute from "./components/RoleBasedRoute";

// Distillery pages
import DistilleryDashboard from "./pages/distillery/Dashboard";
import DistilleryCasks from "./pages/distillery/Casks";
import DistilleryAnalytics from "./pages/distillery/Analytics";
import DistilleryVerification from "./pages/distillery/Verification";
import BlockchainExample from "./pages/BlockchainExample";
import BlockchainTesting from "./pages/BlockchainTesting";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Set up global error handlers
setupResizeObserverErrorHandler();

const AppRoutes = () => {
  const { user, loading, profileComplete } = useAuth();
  
  console.log('AppRoutes render:', { 
    hasUser: !!user, 
    loading, 
    profileComplete, 
    userId: user?.id,
    userEmail: user?.email,
    isMagicUser: !!user?.user_metadata?.wallet_address 
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but profile is not complete, show profile completion
  if (user && !profileComplete) {
    console.log('Showing ProfileCompletion - user authenticated but profile incomplete');
    return <ProfileCompletion />;
  }

  return (
    <Routes>
      {/* Auth pages without layout */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* All other routes with layout */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Consumer Journey - Available to consumers and administrators */}
            <Route 
              path="/consumer-journey" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'administrator', 'investor', 'distillery', 'facilitator']}>
                  <ConsumerJourney />
                </RoleBasedRoute>
              } 
            />
            
            {/* Marketplace and related features - Available to all */}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/cask/:id" element={<CaskDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/comparison" element={<Comparison />} />
            
            {/* User Profile and Portfolio - Available to consumers and others */}
            <Route 
              path="/profile" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <Profile />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/portfolio" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <Portfolio />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <Reports />
                </RoleBasedRoute>
              } 
            />
            
            {/* Advanced features - Restricted from consumers unless admin */}
            <Route 
              path="/insights" 
              element={
                <RoleBasedRoute allowedRoles={['investor', 'distillery', 'facilitator', 'administrator']}>
                  <Insights />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <Notifications />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <RoleBasedRoute allowedRoles={['investor', 'distillery', 'facilitator', 'administrator']}>
                  <Transactions />
                </RoleBasedRoute>
              } 
            />
            
            {/* Documentation and Help - Available to all */}
            <Route path="/docs" element={
              <RoleBasedRoute allowedRoles={['investor', 'distillery', 'facilitator', 'administrator']}>
                <Documentation />
              </RoleBasedRoute>
            } />
            <Route path="/help" element={<Help />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Admin and Testing - Admin only */}
            <Route 
              path="/admin" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <Admin />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <AdminDashboard />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/test-data" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <TestData />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/blockchain-testing" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <BlockchainTesting />
                </RoleBasedRoute>
              } 
            />
            
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Distillery Routes - Distillery and Admin only */}
            <Route 
              path="/distillery" 
              element={
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryDashboard />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/distillery/casks" 
              element={
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryCasks />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/distillery/analytics" 
              element={
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryAnalytics />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/distillery/verification" 
              element={
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryVerification />
                </RoleBasedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MagicProvider>
          <AuthProvider>
            <ComparisonProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </BrowserRouter>
            </ComparisonProvider>
          </AuthProvider>
        </MagicProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
