/**
 * API Service for Beyti Platform
 * Base API functions for interacting with the backend
 */

// Base URL for all API requests
const BASE_URL = 'https://localhost:7062/api';

/**
 * Generic fetch helper function with error handling
 * @param {string} endpoint - API endpoint (e.g., '/MembershipPlans')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {Error} - Throws error with message if request fails
 */
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        `API Error: ${response.status} ${response.statusText}`
      );
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
};

/**
 * Get all membership plans
 *
 * Usage example:
 * ```javascript
 * import { getMembershipPlans } from './services/api';
 *
 * try {
 *   const plans = await getMembershipPlans();
 *   console.log('All plans:', plans);
 * } catch (error) {
 *   console.error('Failed to fetch plans:', error.message);
 * }
 * ```
 *
 * @returns {Promise<Array>} - Array of all membership plans
 */
export const getMembershipPlans = async () => {
  return await fetchAPI('/MembershipPlans');
};

/**
 * Get a single membership plan by ID
 *
 * Usage example:
 * ```javascript
 * import { getMembershipPlan } from './services/api';
 *
 * try {
 *   const plan = await getMembershipPlan(1);
 *   console.log('Plan details:', plan);
 * } catch (error) {
 *   console.error('Failed to fetch plan:', error.message);
 * }
 * ```
 *
 * @param {number} id - The membership plan ID
 * @returns {Promise<object>} - Single membership plan object
 */
export const getMembershipPlan = async (id) => {
  return await fetchAPI(`/MembershipPlans/${id}`);
};

/**
 * Create a new membership plan
 *
 * Usage example:
 * ```javascript
 * import { createMembershipPlan } from './services/api';
 *
 * const newPlan = {
 *   Name: 'Gold Plan',
 *   Description: 'Access to premium content',
 *   MonthlyPrice: 99.99,
 *   DurationDays: 30
 * };
 *
 * try {
 *   const createdPlan = await createMembershipPlan(newPlan);
 *   console.log('Plan created:', createdPlan);
 * } catch (error) {
 *   console.error('Failed to create plan:', error.message);
 * }
 * ```
 *
 * @param {object} data - Membership plan data (use PascalCase: Name, Description, MonthlyPrice, DurationDays)
 * @returns {Promise<object>} - Created membership plan object
 */
export const createMembershipPlan = async (data) => {
  return await fetchAPI('/MembershipPlans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing membership plan
 *
 * Usage example:
 * ```javascript
 * import { updateMembershipPlan } from './services/api';
 *
 * const updatedData = {
 *   Name: 'Gold Plus Plan',
 *   Description: 'Access to premium and exclusive content',
 *   MonthlyPrice: 129.99,
 *   DurationDays: 30
 * };
 *
 * try {
 *   const updatedPlan = await updateMembershipPlan(1, updatedData);
 *   console.log('Plan updated:', updatedPlan);
 * } catch (error) {
 *   console.error('Failed to update plan:', error.message);
 * }
 * ```
 *
 * @param {number} id - The membership plan ID to update
 * @param {object} data - Updated membership plan data (use PascalCase: Name, Description, MonthlyPrice, DurationDays)
 * @returns {Promise<object>} - Updated membership plan object
 */
export const updateMembershipPlan = async (id, data) => {
  return await fetchAPI(`/MembershipPlans/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a membership plan
 *
 * Usage example:
 * ```javascript
 * import { deleteMembershipPlan } from './services/api';
 *
 * try {
 *   await deleteMembershipPlan(1);
 *   console.log('Plan deleted successfully');
 * } catch (error) {
 *   console.error('Failed to delete plan:', error.message);
 * }
 * ```
 *
 * @param {number} id - The membership plan ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteMembershipPlan = async (id) => {
  return await fetchAPI(`/MembershipPlans/delete/${id}`, {
    method: 'DELETE',
  });
};

// --- Admin APIs ---

/**
 * Get all admin profiles
 * @returns {Promise<Array>} - Array of all admin profiles
 */
export const getAdmins = async () => {
  return await fetchAPI('/AdminProfiles');
};

/**
 * Get a single admin profile by ID
 * @param {number} id - Admin profile ID
 * @returns {Promise<object>} - Admin profile object
 */
export const getAdmin = async (id) => {
  return await fetchAPI(`/AdminProfiles/${id}`);
};

/**
 * Create a new admin profile
 * @param {object} data - Admin profile data
 * @returns {Promise<object>} - Created admin profile object
 */
export const createAdmin = async (data) => {
  return await fetchAPI('/AdminProfiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing admin profile
 * @param {number} id - Admin profile ID to update
 * @param {object} data - Updated admin profile data
 * @returns {Promise<object>} - Updated admin profile object
 */
export const updateAdmin = async (id, data) => {
  return await fetchAPI(`/AdminProfiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete an admin profile
 * @param {number} id - Admin profile ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteAdmin = async (id) => {
  return await fetchAPI(`/AdminProfiles/${id}`, {
    method: 'DELETE',
  });
};

// --- Seller APIs ---

/**
 * Get all sellers
 * @returns {Promise<Array>} - Array of all sellers
 */
export const getSellers = async () => {
  return await fetchAPI('/Sellers');
};

/**
 * Get a single seller by ID
 * @param {number} id - Seller ID
 * @returns {Promise<object>} - Seller object
 */
export const getSeller = async (id) => {
  return await fetchAPI(`/Sellers/${id}`);
};

/**
 * Create a new seller
 * @param {object} data - Seller data (PascalCase: UserProfileId, StoreName, Phone)
 * @returns {Promise<object>} - Created seller object
 */
export const createSeller = async (data) => {
  return await fetchAPI('/Sellers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing seller
 * @param {number} id - Seller ID to update
 * @param {object} data - Updated seller data
 * @returns {Promise<object>} - Updated seller object
 */
export const updateSeller = async (id, data) => {
  return await fetchAPI(`/Sellers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a seller
 * @param {number} id - Seller ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteSeller = async (id) => {
  return await fetchAPI(`/Sellers/${id}`, {
    method: 'DELETE',
  });
};

// --- Product APIs ---

/**
 * Get all products
 * @returns {Promise<Array>} - Array of all products
 */
export const getProducts = async () => {
  return await fetchAPI('/Products');
};

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<object>} - Product object
 */
export const getProduct = async (id) => {
  return await fetchAPI(`/Products/${id}`);
};

/**
 * Create a new product
 * @param {object} data - Product data
 *   Example: { SellerId, SubCategoryId, Name, Description, BasePrice, IsActive, GenderId }
 * @returns {Promise<object>} - Created product object
 */
export const createProduct = async (data) => {
  return await fetchAPI('/Products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing product
 * @param {number} id - Product ID to update
 * @param {object} data - Updated product data
 * @returns {Promise<object>} - Updated product object
 */
export const updateProduct = async (id, data) => {
  return await fetchAPI(`/Products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a product
 * @param {number} id - Product ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteProduct = async (id) => {
  return await fetchAPI(`/Products/${id}`, {
    method: 'DELETE',
  });
};
