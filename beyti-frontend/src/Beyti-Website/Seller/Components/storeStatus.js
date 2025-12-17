/**
 * Simple store status check - no time calculations
 */
export const isStoreOpen = (seller) => {
  return seller?.isOpen === true;
};

/**
 * Format time is no longer needed but kept for backward compatibility
 */
export const formatTime = (timeStr) => {
  return '';
};