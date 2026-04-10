import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';
import { SignInPrompt } from '@/components/SignInPrompt';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleBasedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}: RoleBasedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  // If still loading, show loading state
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

  // If not authenticated, show sign-in prompt instead of silent redirect
  if (!user) {
    return (
      <SignInPrompt
        title="Sign in required"
        description="You need to be signed in to access this page."
      />
    );
  }

  // If user is authenticated but role hasn't loaded yet, wait
  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Administrator can access everything
  if (userRole === 'administrator') {
    return <>{children}</>;
  }

  // Check if user role is in allowed roles
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  // Authenticated but wrong role — redirect
  return <Navigate to={redirectTo} replace />;
};

export default RoleBasedRoute;
