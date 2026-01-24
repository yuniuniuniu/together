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
  const { isAuthenticated, isLoading, user } = useAuth();
  const { space, isLoading: isSpaceLoading } = useSpace();
  const location = useLocation();
  const isProfileComplete = !!(user?.nickname && user?.avatar);
  // Space is complete when both partners have joined
  const isSpaceComplete = space && space.partners && space.partners.length >= 2;

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

  if (!isProfileComplete && location.pathname !== '/setup/profile') {
    return <Navigate to="/setup/profile" state={{ from: location }} replace />;
  }

  // Only redirect to dashboard if space is complete (both partners joined)
  if (!requireSpace && isSpaceComplete && isProfileComplete) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // For routes that require a complete space
  if (requireSpace && !isSpaceComplete) {
    // If has incomplete space, go to create page to wait for partner
    if (space) {
      return <Navigate to="/setup/create" state={{ from: location }} replace />;
    }
    // No space at all, go to sanctuary
    return <Navigate to="/sanctuary" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { space, isLoading: isSpaceLoading } = useSpace();
  const isProfileComplete = !!(user?.nickname && user?.avatar);
  // Space is complete when both partners have joined
  const isSpaceComplete = space && space.partners && space.partners.length >= 2;

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
    if (!isProfileComplete) {
      return <Navigate to="/setup/profile" replace />;
    }
    // Check if user has a complete space (both partners joined)
    if (isSpaceComplete) {
      // User is fully set up with complete space, go to dashboard
      return <Navigate to="/dashboard" replace />;
    }
    // If has space but not complete, go to create page to wait for partner
    if (space) {
      return <Navigate to="/setup/create" replace />;
    }
    // No space at all, go to sanctuary
    return <Navigate to="/sanctuary" replace />;
  }

  return <>{children}</>;
};
