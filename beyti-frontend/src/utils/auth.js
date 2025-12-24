/**
 * Authentication Utility Functions
 *
 * Centralized functions for handling authentication state
 */

/**
 * Logout function - clears all user data from localStorage
 */
export const logout = () => {
  console.log('[Auth] Logging out user');

  // Clear all authentication and user data
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userProfileId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userPhone');

  console.log('[Auth] User data cleared from localStorage');
};

/**
 * Check if user is logged in
 * @returns {boolean} - True if user has valid auth token
 */
export const isLoggedIn = () => {
  const authToken = localStorage.getItem('authToken');
  return !!authToken;
};

/**
 * Get current user's role
 * @returns {string|null} - User role or null if not logged in
 */
export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

/**
 * Get current user's ID (ASP.NET Identity GUID)
 * @returns {string|null} - User ID or null if not logged in
 */
export const getUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * Get current user's Profile ID (integer used for database relationships)
 * @returns {number|null} - User Profile ID or null if not logged in
 */
export const getUserProfileId = () => {
  const profileId = localStorage.getItem('userProfileId');
  return profileId ? parseInt(profileId) : null;
};

/**
 * Get current user's name
 * @returns {string|null} - User name or null if not available
 */
export const getUserName = () => {
  return localStorage.getItem('userName');
};
