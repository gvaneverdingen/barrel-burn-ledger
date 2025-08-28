import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MagicProvider } from "@/contexts/MagicContext";
import ProfileCompletion from "@/components/ProfileCompletion";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Marketplace from "./pages/Marketplace";
import CaskDetails from "./pages/CaskDetails";
import Profile from "./pages/Profile";
import Portfolio from "./pages/Portfolio";
import Admin from "./pages/Admin";
import TestData from "./pages/TestData";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import Insights from "./pages/Insights";
import Notifications from "./pages/Notifications";
import Transactions from "./pages/Transactions";
import Documentation from "./pages/Documentation";
import Help from "./pages/Help";
import Settings from "./pages/Settings";

// Distillery pages
import DistilleryDashboard from "./pages/distillery/Dashboard";
import DistilleryCasks from "./pages/distillery/Casks";
import DistilleryAnalytics from "./pages/distillery/Analytics";
import DistilleryVerification from "./pages/distillery/Verification";

const queryClient = new QueryClient();

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
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/cask/:id" element={<CaskDetails />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/docs" element={<Documentation />} />
      <Route path="/help" element={<Help />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/test-data" element={<TestData />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      
      {/* Distillery Routes */}
      <Route path="/distillery" element={<DistilleryDashboard />} />
      <Route path="/distillery/casks" element={<DistilleryCasks />} />
      <Route path="/distillery/analytics" element={<DistilleryAnalytics />} />
      <Route path="/distillery/verification" element={<DistilleryVerification />} />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MagicProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </MagicProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
