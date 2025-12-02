import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import PasswordInput from '../../components/PasswordInput';
import { login } from '../../services/api';

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

      // Store authentication data in localStorage
      localStorage.setItem('authToken', response.Token);
      localStorage.setItem('userId', response.UserId);
      localStorage.setItem('userRole', response.Role);

      // Redirect to home page
      navigate('/');
    } catch (err) {
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
