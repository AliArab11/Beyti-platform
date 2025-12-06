/**
 * Authentication Utilities
 *
 * Helper functions for authentication, authorization, and suspension checks
 */

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid auth token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  return !!(token && userId);
};

/**
 * Get current user's role
 * @returns {string|null} User role or null if not authenticated
 */
export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

/**
 * Get current user's ID
 * @returns {string|null} User ID or null if not authenticated
 */
export const getUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * Get auth token
 * @returns {string|null} Auth token or null if not authenticated
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Check if user has required role
 * @param {string} requiredRole - The role required to access a resource
 * @returns {boolean} True if user has the required role
 */
export const hasRole = (requiredRole) => {
  const userRole = getUserRole();
  return userRole === requiredRole;
};

/**
 * Logout user and clear authentication data
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
};

/**
 * Check if error response indicates suspended account
 * @param {object} error - Error object from API call
 * @returns {boolean} True if error indicates account suspension
 */
export const isSuspensionError = (error) => {
  if (!error) return false;

  // Check for 403 status code
  if (error.status === 403 || error.statusCode === 403) {
    return true;
  }

  // Check error message content
  const errorMessage = error.message || error.error || '';
  const lowerMessage = errorMessage.toLowerCase();

  return (
    lowerMessage.includes('suspended') ||
    lowerMessage.includes('account suspended') ||
    error.isSuspended === true
  );
};

/**
 * Handle API error and check for suspension
 * @param {object} error - Error object from API call
 * @param {function} navigate - React Router navigate function
 * @returns {boolean} True if suspension was detected and handled
 */
export const handleSuspensionError = (error, navigate) => {
  if (isSuspensionError(error)) {
    navigate('/account-suspended');
    return true;
  }
  return false;
};
