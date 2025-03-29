
import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isLoaded, userId, sessionId, orgRole } = useAuth();
  const { toast } = useToast();
  
  // For admin and officer routes, allow access without authentication for demo purposes
  if (allowedRoles.includes('admin') || allowedRoles.includes('officer')) {
    console.log('Allowing direct access to protected route for demo purposes');
    return <>{children}</>;
  }
  
  // Show loading indicator while Clerk loads
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to sign in
  if (!userId || !sessionId) {
    return <Navigate to="/sign-in" replace />;
  }
  
  // If roles are specified and user doesn't have the required role
  if (allowedRoles.length > 0 && orgRole && !allowedRoles.includes(orgRole)) {
    // Redirect based on role
    if (orgRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (orgRole === 'officer') {
      return <Navigate to="/officer-dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

export default AuthenticatedRoute;
