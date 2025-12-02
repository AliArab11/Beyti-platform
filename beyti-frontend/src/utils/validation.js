/**
 * Form Validation Utilities
 *
 * Reusable validation functions for the Beyti platform registration flows.
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate password strength
 * Returns object with validation details for displaying requirements
 * Backend requires: min 6 characters, at least 1 digit
 *
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 *   {
 *     isValid: boolean,
 *     hasMinLength: boolean,
 *     hasDigit: boolean
 *   }
 */
export const validatePassword = (password) => {
  const hasMinLength = password.length >= 6;
  const hasDigit = /\d/.test(password);

  return {
    isValid: hasMinLength && hasDigit,
    hasMinLength,
    hasDigit
  };
};

/**
 * Validate phone number format
 * Accepts formats like: +97312345678, 97312345678, 12345678
 * Basic validation: 8-15 digits, optional + prefix
 *
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const validatePhone = (phone) => {
  const re = /^\+?[\d\s-]{8,15}$/;
  return re.test(phone);
};

/**
 * Check if passwords match
 * @param {string} password - Original password
 * @param {string} confirm - Confirmation password
 * @returns {boolean} - True if passwords match
 */
export const passwordsMatch = (password, confirm) => {
  return password === confirm && password.length > 0;
};

/**
 * Validate required field is not empty
 * @param {string} value - Field value to check
 * @returns {boolean} - True if field has value
 */
export const validateRequired = (value) => {
  return value !== null && value !== undefined && String(value).trim().length > 0;
};

/**
 * Validate numeric value
 * @param {string|number} value - Value to validate
 * @returns {boolean} - True if valid number
 */
export const validateNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate min/max price range
 * @param {number} min - Minimum price
 * @param {number} max - Maximum price
 * @returns {boolean} - True if max >= min
 */
export const validatePriceRange = (min, max) => {
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  return validateNumber(minNum) && validateNumber(maxNum) && maxNum >= minNum;
};
