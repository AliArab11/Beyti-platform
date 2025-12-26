import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DashboardRouter Component
 *
 * Smart router that redirects users to their role-specific dashboard.
 * Reads userRole from localStorage and routes accordingly.
 *
 * Role Mappings:
 * - Seller -> /seller-dashboard
 * - ServiceProvider -> /serviceprovider-dashboard
 * - Admin -> /admin-view
 * - Driver -> /driver-dashboard
 * - Customer -> /customer-dashboard
 * - Invalid/Missing -> /login (fallback)
 */
export default function DashboardRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get user role and auth token from localStorage
    const userRole = localStorage.getItem('userRole');
    const authToken = localStorage.getItem('authToken');

    console.log('[DashboardRouter] Routing user with role:', userRole);

    // Check if user is authenticated
    if (!authToken) {
      console.warn('[DashboardRouter] No auth token found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // Route based on user role
    switch (userRole) {
      case 'Seller':
        console.log('[DashboardRouter] Redirecting to seller dashboard');
        navigate('/seller-dashboard', { replace: true });
        break;

      case 'ServiceProvider':
        console.log('[DashboardRouter] Redirecting to service provider dashboard');
        navigate('/serviceprovider-dashboard', { replace: true });
        break;

      case 'Admin':
        console.log('[DashboardRouter] Redirecting to admin view');
        navigate('/admin-view', { replace: true });
        break;

      case 'Driver':
        console.log('[DashboardRouter] Driver role detected, redirecting to driver dashboard');
        navigate('/driver-dashboard', { replace: true });
        break;

      case 'Customer':
        console.log('[DashboardRouter] Customer role detected, redirecting to home');
        navigate('/', { replace: true });
        break;

      case 'Pending':
        console.log('[DashboardRouter] Pending role detected, redirecting to pending approval page');
        navigate('/pending-approval', { replace: true });
        break;

      default:
        console.warn('[DashboardRouter] Invalid or missing role, redirecting to login');
        navigate('/login', { replace: true });
        break;
    }
  }, [navigate]);

  // Show minimal loading UI while redirecting
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-body-regular text-charcoal-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
