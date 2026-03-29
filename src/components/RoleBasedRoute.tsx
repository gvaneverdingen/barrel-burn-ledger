import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

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

  if (import.meta.env.DEV) {
    console.log('RoleBasedRoute:', { hasUser: !!user, userRole, loading, allowedRoles });
  }

  // If still loading, show loading state
  if (loading) {
    if (import.meta.env.DEV) console.log('RoleBasedRoute: Still loading auth...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but role hasn't loaded yet, wait
  if (user && !userRole) {
    if (import.meta.env.DEV) console.log('RoleBasedRoute: User authenticated but role not loaded yet...');
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
    if (import.meta.env.DEV) console.log('RoleBasedRoute: Administrator access granted');
    return <>{children}</>;
  }

  // Check if user role is in allowed roles
  if (userRole && allowedRoles.includes(userRole)) {
    if (import.meta.env.DEV) console.log('RoleBasedRoute: Access granted for role:', userRole);
    return <>{children}</>;
  }

  // If not authenticated or not allowed, redirect
  if (import.meta.env.DEV) console.log('RoleBasedRoute: Access denied, redirecting to:', redirectTo);
  return <Navigate to={redirectTo} replace />;
};

export default RoleBasedRoute;