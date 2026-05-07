import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MagicProvider } from "@/contexts/MagicContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupResizeObserverErrorHandler } from "@/utils/resizeObserver";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProfileCompletion from "@/components/ProfileCompletion";
import RoleBasedRoute from "./components/RoleBasedRoute";

// Critical routes - load immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load non-critical routes
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Offers = lazy(() => import("./pages/Offers"));
const Comparison = lazy(() => import("./pages/Comparison"));
const Reports = lazy(() => import("./pages/Reports"));
const CaskDetails = lazy(() => import("./pages/CaskDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const CaskDataManagement = lazy(() => import("./pages/admin/CaskDataManagement"));
const TestData = lazy(() => import("./pages/TestData"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Insights = lazy(() => import("./pages/Insights"));
const MarketInsights = lazy(() => import("./pages/MarketInsights"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Help = lazy(() => import("./pages/Help"));
const Settings = lazy(() => import("./pages/Settings"));
const ConsumerJourney = lazy(() => import("./pages/ConsumerJourney"));
const DistilleryDashboard = lazy(() => import("./pages/distillery/Dashboard"));
const DistilleryCasks = lazy(() => import("./pages/distillery/Casks"));
const DistilleryAnalytics = lazy(() => import("./pages/distillery/Analytics"));
const DistilleryVerification = lazy(() => import("./pages/distillery/Verification"));
const DistilleryOnboarding = lazy(() => import("./pages/distillery/Onboarding"));
const DistilleryNewCask = lazy(() => import("./pages/distillery/NewCask"));
const BlockchainExample = lazy(() => import("./pages/BlockchainExample"));
const BlockchainTesting = lazy(() => import("./pages/BlockchainTesting"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const DistilleryProfile = lazy(() => import("./pages/DistilleryProfile"));

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
    return <ProfileCompletion />;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <Routes>
        {/* Auth and payment pages without layout */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        
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
            <Route path="/distillery/:id" element={<DistilleryProfile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/comparison" element={<Comparison />} />
            
            {/* User Profile and Portfolio - accessible to any authenticated user, data is still protected by RLS */}
            <Route 
              path="/profile" 
              element={<Profile />} 
            />
            <Route 
              path="/portfolio" 
              element={<Portfolio />} 
            />
            <Route 
              path="/reports" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <Reports />
                </RoleBasedRoute>
              } 
            />
            
            {/* Advanced features - Available to all authenticated users */}
            <Route 
              path="/insights" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <Insights />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/market-insights" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <MarketInsights />
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
              element={<Transactions />} 
            />
            
            {/* Documentation and Help - Available to all */}
            <Route path="/docs" element={
              <RoleBasedRoute allowedRoles={['distillery', 'administrator', 'consumer']}>
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
              path="/admin/cask-data" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <CaskDataManagement />
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
              path="/distillery/casks/new" 
              element={
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryNewCask />
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
            <Route 
              path="/distillery/onboarding" 
              element={<DistilleryOnboarding />} 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      } />
    </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MagicProvider>
          <AuthProvider>
            <CurrencyProvider>
              <ComparisonProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                </BrowserRouter>
              </ComparisonProvider>
            </CurrencyProvider>
          </AuthProvider>
        </MagicProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
