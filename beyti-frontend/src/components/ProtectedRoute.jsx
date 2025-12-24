/**
 * Protected Route Component
 *
 * Provides role-based route protection for the Beyti platform.
 * Handles authentication and authorization for all user types.
 *
 * Features:
 * - Authentication check (redirects to login if not authenticated)
 * - Role-based authorization (redirects to dashboard if wrong role)
 * - Support for single role or multiple allowed roles
 * - Flexible children or element prop for rendering
 */

import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isLoggedIn, getUserRole } from '../utils/auth';

const ProtectedRoute = ({
  element,
  children,
  requiredRole = null,      // Single role string (e.g., "Admin")
  allowedRoles = null,      // Array of roles (e.g., ["Admin", "Seller"])
  requireAuth = true,       // Set false for public routes
}) => {
  const navigate = useNavigate();
  const isAuthenticated = isLoggedIn();
  const userRole = getUserRole();

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    console.log('[ProtectedRoute] User not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if required
  if (requireAuth && (requiredRole || allowedRoles)) {
    let hasPermission = false;

    if (requiredRole) {
      // Single role check
      hasPermission = userRole === requiredRole;
      if (!hasPermission) {
        console.log(`[ProtectedRoute] User role '${userRole}' does not match required role '${requiredRole}', redirecting to /dashboard`);
      }
    } else if (allowedRoles && Array.isArray(allowedRoles)) {
      // Multiple roles check
      hasPermission = allowedRoles.includes(userRole);
      if (!hasPermission) {
        console.log(`[ProtectedRoute] User role '${userRole}' not in allowed roles [${allowedRoles.join(', ')}], redirecting to /dashboard`);
      }
    }

    // Redirect to dashboard if user doesn't have permission
    // Dashboard router will redirect to appropriate dashboard based on role
    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Render the protected component
  // Support both 'element' prop and 'children' pattern
  return element || children;
};

export default ProtectedRoute;
