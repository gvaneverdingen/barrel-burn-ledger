import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import { Seo } from "@/components/Seo";

// Small helper to attach per-route metadata without touching each page component
const WithSeo = ({
  seo,
  children,
}: {
  seo: React.ComponentProps<typeof Seo>;
  children: React.ReactNode;
}) => (
  <>
    <Seo {...seo} />
    {children}
  </>
);

const privateSeo = (title: string, description: string) => ({
  title,
  description,
  noIndex: true,
});

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
const SellCask = lazy(() => import("./pages/SellCask"));
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
const About = lazy(() => import("./pages/About"));
const DistilleryDashboard = lazy(() => import("./pages/distillery/Dashboard"));
const DistilleryCasks = lazy(() => import("./pages/distillery/Casks"));
const DistilleryAnalytics = lazy(() => import("./pages/distillery/Analytics"));
const DistilleryVerification = lazy(() => import("./pages/distillery/Verification"));
const DistilleryOnboarding = lazy(() => import("./pages/distillery/Onboarding"));
const DistilleryNewCask = lazy(() => import("./pages/distillery/NewCask"));
const WarehouseDashboard = lazy(() => import("./pages/warehouse/Dashboard"));
const WarehouseOnboarding = lazy(() => import("./pages/warehouse/Onboarding"));
const WarehouseVerification = lazy(() => import("./pages/warehouse/Verification"));
const WarehouseNewCask = lazy(() => import("./pages/warehouse/NewCask"));
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
        <Route path="/auth" element={<WithSeo seo={privateSeo('Sign In | ARIGI', 'Sign in or create an ARIGI account to buy, sell and manage whisky casks.')}><Auth /></WithSeo>} />
        <Route path="/reset-password" element={<WithSeo seo={privateSeo('Reset Password | ARIGI', 'Reset the password for your ARIGI account.')}><ResetPassword /></WithSeo>} />
        <Route path="/unsubscribe" element={<WithSeo seo={privateSeo('Email Preferences | ARIGI', 'Manage your ARIGI email notification preferences.')}><Unsubscribe /></WithSeo>} />
        <Route path="/payment-success" element={<WithSeo seo={privateSeo('Payment Confirmation | ARIGI', 'Confirming your cask purchase.')}><PaymentSuccess /></WithSeo>} />
        
        {/* All other routes with layout */}
        <Route path="/*" element={
        <Layout>
          <Suspense fallback={
            <div className="mobile-container py-12 flex items-center justify-center min-h-[50vh]">
              <LoadingSpinner />
            </div>
          }>
          <Routes>
            <Route
              path="/"
              element={
                <WithSeo
                  seo={{
                    title: 'ARIGI — Buy & Own Whisky Casks | Blockchain-Verified Cask Investment',
                    description:
                      'ARIGI connects buyers and investors with premium distilleries and bonded warehouses. Browse whisky casks for sale with blockchain-verified provenance.',
                    canonical: '/',
                    jsonLd: {
                      '@context': 'https://schema.org',
                      '@type': 'Organization',
                      name: 'ARIGI',
                      url: 'https://barrel-burn-ledger.lovable.app/',
                      logo: 'https://barrel-burn-ledger.lovable.app/og-image.jpg',
                      description:
                        'Blockchain-verified whisky cask marketplace connecting buyers with distilleries and bonded warehouses.',
                    },
                  }}
                >
                  <Index />
                </WithSeo>
              }
            />
            
            {/* Consumer Journey - Available to consumers and administrators */}
            <Route 
              path="/consumer-journey" 
              element={
                
                  <WithSeo
                    seo={{
                      title: 'Secure Buyer Profile | ARIGI',
                      description:
                        'Step through the ARIGI buyer journey: verify your profile, choose a cask, complete secure payment and track maturation.',
                      canonical: '/consumer-journey',
                    }}
                  >
                    <RoleBasedRoute allowedRoles={['consumer', 'administrator', 'investor', 'distillery', 'facilitator']}><ConsumerJourney /></RoleBasedRoute>
                  </WithSeo>
              } 
            />
            
            {/* Marketplace and related features - Available to all */}
            <Route
              path="/about"
              element={
                <WithSeo
                  seo={{
                    title: 'Our Story | ARIGI — Whisky Casks Direct From the Distillery',
                    description:
                      'ARIGI was built by bulk spirits traders who saw how opaque the cask market had become. Every cask comes direct from the distillery or a verified owner, with provenance recorded on-chain.',
                    canonical: '/about',
                    jsonLd: {
                      '@context': 'https://schema.org',
                      '@type': 'Organization',
                      name: 'ARIGI',
                      url: 'https://barrel-burn-ledger.lovable.app/',
                      logo: 'https://barrel-burn-ledger.lovable.app/og-image.jpg',
                      description:
                        'Whisky cask marketplace sourcing direct from distilleries and verified owners, with on-chain provenance.',
                    },
                  }}
                >
                  <About />
                </WithSeo>
              }
            />
            <Route
              path="/marketplace"
              element={
                <WithSeo
                  seo={{
                    title: 'Whisky Casks for Sale | ARIGI Marketplace',
                    description:
                      'Browse whisky casks for sale by region, age, spirit type and price. Every listing carries blockchain-verified provenance on ARIGI.',
                    canonical: '/marketplace',
                  }}
                >
                  <Marketplace />
                </WithSeo>
              }
            />
            <Route path="/cask/:id" element={<CaskDetails />} />
            <Route path="/distillery/dashboard" element={<Navigate to="/distillery" replace />} />
            <Route path="/warehouse/dashboard" element={<Navigate to="/warehouse" replace />} />
            <Route path="/distillery/:id" element={<DistilleryProfile />} />
            <Route path="/wishlist" element={<WithSeo seo={privateSeo('Your Wishlist | ARIGI', 'Casks you are tracking on ARIGI.')}><Wishlist /></WithSeo>} />
            <Route path="/offers" element={<WithSeo seo={privateSeo('Your Offers | ARIGI', 'Offers you have made or received on ARIGI.')}><Offers /></WithSeo>} />
            <Route path="/comparison" element={<WithSeo seo={privateSeo('Compare Casks | ARIGI', 'Compare selected casks side by side.')}><Comparison /></WithSeo>} />
            
            {/* User Profile and Portfolio - accessible to any authenticated user, data is still protected by RLS */}
            <Route 
              path="/profile" 
              element={<WithSeo seo={privateSeo('Your Profile | ARIGI', 'Manage your ARIGI account information.')}><Profile /></WithSeo>}
            />
            <Route
              path="/sell"
              element={<WithSeo seo={privateSeo('Resell a Cask | ARIGI', 'List a cask you own for resale and confirm the sale.')}><SellCask /></WithSeo>}
            />
            <Route 
              path="/portfolio" 
              element={<WithSeo seo={privateSeo('Your Portfolio | ARIGI', 'Track the casks you own and their maturation.')}><Portfolio /></WithSeo>}
            />
            <Route 
              path="/reports" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <WithSeo seo={privateSeo('Reports | ARIGI', 'Download and review your ARIGI account reports.')}><Reports /></WithSeo>
                </RoleBasedRoute>
              } 
            />
            
            {/* Advanced features - Available to all authenticated users */}
            <Route 
              path="/insights" 
              element={
                <WithSeo seo={{ title: 'Whisky Cask Market Insights | ARIGI', description: 'Live platform analytics on cask listings, regions and pricing trends.', canonical: '/insights' }}><RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}><Insights /></RoleBasedRoute></WithSeo>
              } 
            />
            <Route 
              path="/market-insights" 
              element={
                <WithSeo seo={{ title: 'AI Whisky Cask Price Tracker | ARIGI', description: 'AI-assisted tracking of current whisky cask market prices and comparable sales.', canonical: '/market-insights' }}><RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}><MarketInsights /></RoleBasedRoute></WithSeo>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <RoleBasedRoute allowedRoles={['consumer', 'investor', 'distillery', 'facilitator', 'administrator']}>
                  <WithSeo seo={privateSeo('Notifications | ARIGI', 'Your ARIGI activity notifications.')}><Notifications /></WithSeo>
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/transactions" 
              element={<WithSeo seo={privateSeo('Transactions | ARIGI', 'Your cask purchase and sale history.')}><Transactions /></WithSeo>}
            />
            
            {/* Documentation and Help - Available to all */}
            <Route path="/docs" element={
              <RoleBasedRoute allowedRoles={['distillery', 'administrator', 'consumer']}>
                <WithSeo seo={{ title: 'Cask Ownership Documentation | ARIGI', description: 'Guides for distilleries, warehouses and buyers: listing casks, provenance documents, WOWGR and settlement.', canonical: '/docs' }}><Documentation /></WithSeo>
              </RoleBasedRoute>
            } />
            <Route path="/help" element={<WithSeo seo={{ title: 'Help Centre & FAQ | ARIGI Whisky Casks', description: 'Answers on buying, storing, insuring and reselling whisky casks through ARIGI.', canonical: '/help' }}><Help /></WithSeo>} />
            <Route path="/settings" element={<WithSeo seo={privateSeo('Settings | ARIGI', 'Manage your ARIGI account settings and preferences.')}><Settings /></WithSeo>} />
            
            {/* Admin and Testing - Admin only */}
            <Route 
              path="/admin" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <WithSeo seo={privateSeo('Admin | ARIGI', 'ARIGI administration.')}><Admin /></WithSeo>
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <WithSeo seo={privateSeo('Admin Dashboard | ARIGI', 'ARIGI administration dashboard.')}><AdminDashboard /></WithSeo>
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/admin/cask-data" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <WithSeo seo={privateSeo('Cask Data Management | ARIGI', 'ARIGI administration.')}><CaskDataManagement /></WithSeo>
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/test-data"
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <WithSeo seo={privateSeo('Test Data | ARIGI', 'Internal QA tooling.')}><TestData /></WithSeo>
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/blockchain-testing" 
              element={
                <RoleBasedRoute allowedRoles={['administrator']}>
                  <WithSeo seo={privateSeo('Blockchain Testing | ARIGI', 'Internal QA tooling.')}><BlockchainTesting /></WithSeo>
                </RoleBasedRoute>
              } 
            />
            
            
            {/* Distillery Routes - Distillery and Admin only */}
            <Route 
              path="/distillery" 
              element={<WithSeo seo={privateSeo('Distillery Dashboard | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryDashboard />
                </RoleBasedRoute></WithSeo>
              } 
            />
            <Route 
              path="/distillery/casks" 
              element={<WithSeo seo={privateSeo('Manage Casks | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryCasks />
                </RoleBasedRoute></WithSeo>
              } 
            />
            <Route 
              path="/distillery/casks/new" 
              element={<WithSeo seo={privateSeo('List a New Cask | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryNewCask />
                </RoleBasedRoute></WithSeo>
              } 
            />
            <Route 
              path="/distillery/analytics" 
              element={<WithSeo seo={privateSeo('Distillery Analytics | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryAnalytics />
                </RoleBasedRoute></WithSeo>
              } 
            />
            <Route 
              path="/distillery/verification" 
              element={<WithSeo seo={privateSeo('Distillery Verification | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={['distillery', 'administrator']}>
                  <DistilleryVerification />
                </RoleBasedRoute></WithSeo>
              } 
            />
            <Route 
              path="/distillery/onboarding" 
              element={<WithSeo seo={privateSeo('Become a Distillery Partner | ARIGI', 'Apply to list your casks on ARIGI.')}><DistilleryOnboarding /></WithSeo>} 
            />

            {/* Warehouse Routes */}
            <Route path="/warehouse/onboarding" element={<WithSeo seo={privateSeo('Warehouse Application | ARIGI', 'Apply to list casks as a bonded warehouse on ARIGI.')}><WarehouseOnboarding /></WithSeo>} />
            <Route
              path="/warehouse"
              element={<WithSeo seo={privateSeo('Warehouse Dashboard | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={["facilitator", "administrator"]}>
                  <WarehouseDashboard />
                </RoleBasedRoute></WithSeo>
              }
            />
            <Route
              path="/warehouse/casks/new"
              element={<WithSeo seo={privateSeo('List a Warehouse Cask | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={["facilitator", "administrator"]}>
                  <WarehouseNewCask />
                </RoleBasedRoute></WithSeo>
              }
            />
            <Route
              path="/warehouse/verification"
              element={<WithSeo seo={privateSeo('Warehouse Verification | ARIGI', 'Manage your ARIGI account.')}>
                <RoleBasedRoute allowedRoles={["facilitator", "administrator"]}>
                  <WarehouseVerification />
                </RoleBasedRoute></WithSeo>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </Layout>
      } />
    </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
   <HelmetProvider>
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
   </HelmetProvider>
  </ErrorBoundary>
);

export default App;
