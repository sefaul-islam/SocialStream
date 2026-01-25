

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * PrivateRoute wrapper component with role-based access
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {Array<string>} props.allowedRoles - Optional array of allowed roles for this route
 * @returns {React.ReactNode} Protected content or redirect
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to auth page while saving the attempted location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Get roles directly from JWT token
  const userRoles = authService.getUserRoles();

  // Check if user has ADMIN role
  const isAdmin = userRoles.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN');

  // If accessing home page and user is admin, redirect to admin dashboard
  if (location.pathname === '/home' && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If accessing admin routes and user is not admin, redirect to home
  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // If allowedRoles specified, check if user has required role
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => 
      userRoles.includes(role) || userRoles.includes(`ROLE_${role}`)
    );

    if (!hasRequiredRole) {
      // Redirect based on user role
      return <Navigate to={isAdmin ? '/admin/dashboard' : '/home'} replace />;
    }
  }

  // User is authenticated and authorized, render the protected content
  return children;
};

export default PrivateRoute;
