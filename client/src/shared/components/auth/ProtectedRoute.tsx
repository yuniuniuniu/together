import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSpace } from '../../context/SpaceContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSpace?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSpace = false
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { space, isLoading: isSpaceLoading } = useSpace();
  const location = useLocation();

  if (isLoading || (requireSpace && isSpaceLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-soft-gray text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireSpace && !space) {
    return <Navigate to="/sanctuary" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { space, isLoading: isSpaceLoading } = useSpace();

  if (isLoading || isSpaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-soft-gray text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Check if user has completed profile setup
    if (!user?.nickname) {
      return <Navigate to="/setup/profile" replace />;
    }
    // Check if user has a space
    if (!space) {
      return <Navigate to="/sanctuary" replace />;
    }
    // User is fully set up, go to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
