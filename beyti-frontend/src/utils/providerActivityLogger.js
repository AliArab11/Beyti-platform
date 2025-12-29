/**
 * Service Provider Activity Logger Utility
 *
 * Tracks and stores service provider actions in localStorage for display in the dashboard
 * Maintains a rolling history of the last 4 service provider actions
 */

/**
 * Log a service provider action to the activity feed
 * @param {number} serviceProviderId - The ID of the service provider
 * @param {string} type - Type of action: 'service', 'booking', 'schedule', 'profile'
 * @param {string} action - Brief description of the action (e.g., "Created New Service")
 * @param {string} details - Additional details about the action (optional)
 */
export const logProviderActivity = (serviceProviderId, type, action, details = null) => {
  try {
    // Get existing activity from localStorage for this specific provider
    const storageKey = `providerRecentActivity_${serviceProviderId}`;
    const stored = localStorage.getItem(storageKey);
    let activities = [];

    if (stored) {
      try {
        activities = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored activity:', e);
        activities = [];
      }
    }

    // Create new activity object
    const newActivity = {
      type,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    // Add to the beginning of the array
    activities.unshift(newActivity);

    // Keep only the last 4 activities
    activities = activities.slice(0, 4);

    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(activities));

    return true;
  } catch (error) {
    console.error('Error logging provider activity:', error);
    return false;
  }
};

/**
 * Get all recent service provider activities
 * @param {number} serviceProviderId - The ID of the service provider
 * @returns {Array} Array of activity objects
 */
export const getRecentProviderActivities = (serviceProviderId) => {
  try {
    const storageKey = `providerRecentActivity_${serviceProviderId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored).slice(0, 4);
    }
    return [];
  } catch (error) {
    console.error('Error getting recent provider activities:', error);
    return [];
  }
};

/**
 * Clear all service provider activities
 * @param {number} serviceProviderId - The ID of the service provider
 */
export const clearProviderActivities = (serviceProviderId) => {
  try {
    const storageKey = `providerRecentActivity_${serviceProviderId}`;
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('Error clearing provider activities:', error);
    return false;
  }
};

/**
 * Example usage:
 *
 * // When creating a new service
 * logProviderActivity(
 *   6, // serviceProviderId
 *   'service',
 *   'Created New Service',
 *   'Service: Home Cleaning'
 * );
 *
 * // When accepting a booking
 * logProviderActivity(
 *   6,
 *   'booking',
 *   'Accepted Booking Request',
 *   'Customer: John Doe'
 * );
 *
 * // When updating availability
 * logProviderActivity(
 *   6,
 *   'schedule',
 *   'Updated Availability',
 *   'Added Monday 9 AM - 5 PM'
 * );
 *
 * // When updating profile
 * logProviderActivity(
 *   6,
 *   'profile',
 *   'Updated Business Profile',
 *   'Changed business hours'
 * );
 */
