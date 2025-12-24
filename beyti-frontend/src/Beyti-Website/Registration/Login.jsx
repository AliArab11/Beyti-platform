import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import PasswordInput from '../../components/PasswordInput';
import { login, getUserProfile } from '../../services/api';
import { isLoggedIn } from '../../utils/auth';

/**
 * Login Page Component
 *
 * Provides email/password authentication for all user types
 * (Customer, Seller, Admin, Driver, Service Provider).
 *
 * Features:
 * - Email + Password authentication
 * - Password show/hide toggle
 * - Error handling and display
 * - Loading state during authentication
 * - Automatic redirect after successful login
 * - Token storage in localStorage
 */
export default function Login() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      console.log('[Login] User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [navigate]);

  /**
   * Handle form submission
   * - Validates input
   * - Calls login API
   * - Stores token and user info
   * - Redirects to home page
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Call login API
      const response = await login({
        Email: email,
        Password: password
      });

      console.log('[Login] API Response:', response);

      // Handle both camelCase and PascalCase response formats
      const token = response.token || response.Token;
      const userId = response.userId || response.UserId;
      const userProfileId = response.userProfileId || response.UserProfileId;
      const apiRole = response.role || response.Role;

      // Check if this is a different user (userId changed)
      const previousUserId = localStorage.getItem('userId');
      const isDifferentUser = previousUserId && previousUserId !== String(userId);

      if (isDifferentUser) {
        console.log('[Login] Different user detected, clearing previous session data');
        // Clear all user-specific data when switching users
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userProfileId');
      }

      // Check if user already has a partner role set (from previous onboarding of SAME user)
      const existingRole = localStorage.getItem('userRole');
      const partnerRoles = ['Seller', 'ServiceProvider', 'Driver', 'Admin'];
      const hasPartnerRole = existingRole && partnerRoles.includes(existingRole);

      // Store authentication data in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userProfileId', userProfileId);

      // Only preserve role if it's the same user with a partner role
      if (!isDifferentUser && hasPartnerRole) {
        console.log('[Login] Preserving existing partner role for same user:', existingRole);
      } else {
        console.log('[Login] Setting role from API:', apiRole);
        localStorage.setItem('userRole', apiRole);
      }

      // Fetch user profile to get additional details (name, email, phone)
      try {
        const userProfile = await getUserProfile(userProfileId);
        console.log('[Login] User Profile Response:', userProfile);

        // Store user profile data in localStorage
        if (userProfile) {
          // Handle different response structures
          const userName = userProfile.FullName || userProfile.DisplayName || userProfile.Name || '';
          const userEmail = userProfile.Email || email; // Fallback to login email
          const userPhone = userProfile.Phone || '';

          localStorage.setItem('userName', userName);
          localStorage.setItem('userEmail', userEmail);
          localStorage.setItem('userPhone', userPhone);

          // Check if user has a partner role (Seller, ServiceProvider, Driver)
          // The profile API may return RoleType or check for specific profile types
          const partnerRole = userProfile.RoleType || userProfile.Role;
          console.log('[Login] Checking partner role:', partnerRole);

          if (partnerRole && partnerRole !== 'Customer') {
            console.log('[Login] Partner role found in profile:', partnerRole);
            localStorage.setItem('userRole', partnerRole);
          } else {
            console.log('[Login] Profile shows Customer role');
            // If profile says Customer, check if partner profiles exist
            // Try to detect partner type from other profile fields
            if (userProfile.ServiceProviderId || userProfile.serviceProviderId) {
              console.log('[Login] ServiceProvider profile detected, updating role');
              localStorage.setItem('userRole', 'ServiceProvider');
            } else if (userProfile.SellerId || userProfile.sellerId) {
              console.log('[Login] Seller profile detected, updating role');
              localStorage.setItem('userRole', 'Seller');
            } else if (userProfile.DriverId || userProfile.driverId) {
              console.log('[Login] Driver profile detected, updating role');
              localStorage.setItem('userRole', 'Driver');
            } else {
              console.log('[Login] No partner profile found in basic profile, checking partner endpoints...');

              // WORKAROUND: Backend doesn't include partner IDs in UserProfile response
              // Check each partner type endpoint that accepts UserProfileId
              try {
                const { getProviderProfile, getSellerByUserProfileId, getDriverByUserProfileId } = await import('../../services/api');

                // Check ServiceProvider
                try {
                  const providerProfile = await getProviderProfile(userProfileId);
                  console.log('[Login] ServiceProvider check result:', providerProfile);
                  if (providerProfile && (providerProfile.Id || providerProfile.ServiceProviderId || providerProfile.id || providerProfile.serviceProviderId)) {
                    console.log('[Login] ✅ Service Provider profile found! Updating role to ServiceProvider');
                    localStorage.setItem('userRole', 'ServiceProvider');
                    // Store the provider ID for dashboard use
                    const providerId = providerProfile.Id || providerProfile.ServiceProviderId || providerProfile.id || providerProfile.serviceProviderId;
                    localStorage.setItem('serviceProviderId', providerId);
                    return; // Exit early
                  }
                } catch (e) {
                  console.log('[Login] ❌ ServiceProvider check failed:', e.message);
                }

                // Check Seller
                try {
                  const sellerProfile = await getSellerByUserProfileId(userProfileId);
                  console.log('[Login] Seller check result:', sellerProfile);
                  if (sellerProfile && (sellerProfile.Id || sellerProfile.SellerId || sellerProfile.id || sellerProfile.sellerId)) {
                    console.log('[Login] ✅ Seller profile found! Updating role to Seller');
                    localStorage.setItem('userRole', 'Seller');
                    // Store the seller ID for dashboard use
                    const sellerId = sellerProfile.Id || sellerProfile.SellerId || sellerProfile.id || sellerProfile.sellerId;
                    localStorage.setItem('sellerId', sellerId);
                    return; // Exit early
                  }
                } catch (e) {
                  console.log('[Login] ❌ Seller check failed:', e.message);
                }

                // Check Driver
                try {
                  const driverProfile = await getDriverByUserProfileId(userProfileId);
                  console.log('[Login] Driver check result:', driverProfile);
                  if (driverProfile && (driverProfile.Id || driverProfile.DriverId || driverProfile.id || driverProfile.driverId)) {
                    console.log('[Login] ✅ Driver profile found! Updating role to Driver');
                    localStorage.setItem('userRole', 'Driver');
                    // Store the driver ID for dashboard use
                    const driverId = driverProfile.Id || driverProfile.DriverId || driverProfile.id || driverProfile.driverId;
                    localStorage.setItem('driverId', driverId);
                    return; // Exit early
                  }
                } catch (e) {
                  console.log('[Login] ❌ Driver check failed:', e.message);
                }

                console.log('[Login] No partner profile found, user remains as Customer');
              } catch (importError) {
                console.warn('[Login] Failed to check partner profiles:', importError);
              }
            }
          }
        }
      } catch (profileError) {
        console.warn('Could not fetch user profile:', profileError);
        // Continue with login even if profile fetch fails
        // Store email from login as fallback
        localStorage.setItem('userEmail', email);
      }

      // Log success and redirect to dashboard router
      const finalRole = localStorage.getItem('userRole');
      console.log('[Login] Login successful, redirecting to dashboard. Role:', finalRole);
      navigate('/dashboard');
    } catch (err) {
      console.error('[Login] Login failed:', err);
      // Map error messages to user-friendly text
      let errorMessage = err.message;

      // Handle common error cases
      if (errorMessage.toLowerCase().includes('invalid credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (errorMessage.toLowerCase().includes('user profile not found')) {
        errorMessage = 'Account setup incomplete. Please contact support.';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (!errorMessage || errorMessage.includes('Request failed')) {
        errorMessage = 'An error occurred during login. Please try again.';
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="bg-grey-200 rounded-lg p-8 shadow-soft-lift border border-grey-stroke max-w-md w-full">
        {/* Header */}
        <h1 className="text-display-h1 text-charcoal-600 mb-2">Welcome Back</h1>
        <p className="text-body-regular text-charcoal-400 mb-6">
          Sign in to your Beyti account
        </p>

        {/* Error Message */}
        {error && (
          <div
            className="bg-error-bg border-l-4 border-error-btn p-4 rounded mb-6"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-body-regular text-error-text">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-label-medium text-charcoal-600">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="
                w-full px-4 py-2
                bg-cream-100 border border-charcoal-400
                text-body-regular text-charcoal-600
                placeholder:text-charcoal-400
                rounded-md
                focus:outline-none focus:ring-2 focus:ring-sage-500
                transition-all duration-200
              "
            />
          </div>

          {/* Password Field */}
          <PasswordInput
            label="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            name="password"
            id="password"
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-body-regular text-charcoal-400">
            Don't have an account?{' '}
            <a
              href="/register"
              className="text-sage-500 hover:text-sage-700 font-medium transition-colors duration-200"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
