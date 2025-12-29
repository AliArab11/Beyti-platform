/**
 * User Context
 *
 * Provides user profile data and methods to all components
 * Supports all user types: Admin, ServiceProvider, Seller, Driver, Customer
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/api';

const UserContext = createContext(null);

export const UserProvider = ({ children, initialUserId, initialUserRole }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(initialUserId);
  const [userRole, setUserRole] = useState(initialUserRole);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!userId) {
      throw new Error('No user ID available');
    }

    try {
      await updateUserProfile(userId, userRole, updates);
      // Refresh the profile after update
      await fetchUserProfile();
      return { success: true };
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  // Fetch profile when userId changes
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const value = {
    userProfile,
    userId,
    userRole,
    loading,
    error,
    setUserId,
    setUserRole,
    fetchUserProfile,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
