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
  const { userRole, loading } = useAuth();

  console.log('RoleBasedRoute:', { userRole, loading, allowedRoles });

  if (loading) {
    console.log('RoleBasedRoute: Still loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Administrator can access everything
  if (userRole === 'administrator') {
    console.log('RoleBasedRoute: Administrator access granted');
    return <>{children}</>;
  }

  // Check if user role is in allowed roles
  if (userRole && allowedRoles.includes(userRole)) {
    console.log('RoleBasedRoute: Access granted for role:', userRole);
    return <>{children}</>;
  }

  // If not allowed, redirect
  console.log('RoleBasedRoute: Access denied, redirecting to:', redirectTo);
  return <Navigate to={redirectTo} replace />;
};

export default RoleBasedRoute;