/**
 * Admin Activity Logger Utility
 *
 * Tracks and stores admin actions in localStorage for display in the dashboard
 * Maintains a rolling history of the last 3 admin actions
 */

/**
 * Log an admin action to the activity feed
 * @param {string} type - Type of action: 'approval', 'user_created', 'suspension', 'moderation'
 * @param {string} action - Brief description of the action (e.g., "Approved Service Provider")
 * @param {string} details - Additional details about the action (optional)
 */
export const logAdminActivity = (type, action, details = null) => {
  try {
    // Get existing activity from localStorage
    const stored = localStorage.getItem('adminRecentActivity');
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

    // Keep only the last 3 activities
    activities = activities.slice(0, 3);

    // Save back to localStorage
    localStorage.setItem('adminRecentActivity', JSON.stringify(activities));

    return true;
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return false;
  }
};

/**
 * Get all recent admin activities
 * @returns {Array} Array of activity objects
 */
export const getRecentActivities = () => {
  try {
    const stored = localStorage.getItem('adminRecentActivity');
    if (stored) {
      return JSON.parse(stored).slice(0, 3);
    }
    return [];
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
};

/**
 * Clear all admin activities
 */
export const clearAdminActivities = () => {
  try {
    localStorage.removeItem('adminRecentActivity');
    return true;
  } catch (error) {
    console.error('Error clearing admin activities:', error);
    return false;
  }
};

/**
 * Example usage:
 *
 * // When approving a service provider request
 * logAdminActivity(
 *   'approval',
 *   'Approved Service Provider Request',
 *   'Business: Fresh Produce Co.'
 * );
 *
 * // When creating a new user
 * logAdminActivity(
 *   'user_created',
 *   'Created New User',
 *   'John Doe - Seller'
 * );
 *
 * // When suspending a user
 * logAdminActivity(
 *   'suspension',
 *   'Suspended User Account',
 *   'Store: Bad Actor Store'
 * );
 *
 * // When moderating a product
 * logAdminActivity(
 *   'moderation',
 *   'Suspended Product',
 *   'Product: Inappropriate Item'
 * );
 */
