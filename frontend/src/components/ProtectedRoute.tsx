import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAudio } from '@/contexts/AudioContext';

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow children to be passed for nested routes if needed
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { clientState } = useAudio();

  if (!clientState.isAuthenticated) {
    // User not authenticated, redirect to login page
    // You can also pass the intended location to redirect back after login
    // return <Navigate to="/login" replace state={{ from: location }} />;
    return <Navigate to="/login" replace />;
  }

  // User is authenticated
  // If children are provided, render them (for nested routes). Otherwise, render the Outlet.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
