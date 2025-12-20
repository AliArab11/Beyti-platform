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

    // Get auth token from localStorage
    const authToken = localStorage.getItem('authToken');

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }

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
      // Try to parse error response
      let errorMessage;
      let errorData = {};
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        // JSON error response
        errorData = await response.json().catch(() => ({}));
        errorMessage = errorData.message || errorData.Message || errorData.title;
      } else {
        // Plain text error response (common for auth endpoints)
        errorMessage = await response.text().catch(() => '');
      }

      // Fallback to generic error if no message found
      if (!errorMessage) {
        errorMessage = `Request failed with status ${response.status}`;
      }

      // Create error object with status and additional data
      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusCode = response.status;
      error.isSuspended = errorData.isSuspended || false;
      error.error = errorData.error || errorMessage;

      throw error;
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

/**
 * Toggle membership plan status (Active/Inactive)
 *
 * Usage example:
 * ```javascript
 * import { toggleMembershipPlanStatus } from './services/api';
 *
 * try {
 *   const updatedPlan = await toggleMembershipPlanStatus(1);
 *   console.log('Plan status toggled:', updatedPlan);
 * } catch (error) {
 *   console.error('Failed to toggle plan status:', error.message);
 * }
 * ```
 *
 * @param {number} id - The membership plan ID
 * @returns {Promise<object>} - Updated membership plan object
 */
export const toggleMembershipPlanStatus = async (id) => {
  return await fetchAPI(`/MembershipPlans/toggle/${id}`, {
    method: 'PATCH',
  });
};

// --- Admin APIs ---
export const getAdmins = async () => {
  return await fetchAPI('/AdminProfiles');
};

export const createAdmin = async (data) => {
  return await fetchAPI('/AdminProfiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAdmin = async (id, data) => {
  return await fetchAPI(`/AdminProfiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const toggleAdminStatus = async (id) => {
  return await fetchAPI(`/AdminProfiles/${id}/toggle`, {
    method: 'PATCH',
  });
};

// --- User Management (FR1) ---

export const getUsers = async (role = null) => {
  const query = role && role !== 'All' ? `?role=${role}` : '';
  return await fetchAPI(`/AdminDashboard/Users${query}`);
};

export const getUser = async (id) => {
  return await fetchAPI(`/AdminDashboard/Users/${id}`);
};

export const createUser = async (data, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/Users?adminUserProfileId=${adminUserProfileId}`
    : '/AdminDashboard/Users';

  return await fetchAPI(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateUser = async (id, data, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/Users/${id}?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/Users/${id}`;
  return await fetchAPI(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const toggleUserStatus = async (id, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/Users/${id}/toggle?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/Users/${id}/toggle`;
  return await fetchAPI(url, {
    method: 'PATCH',
  });
};

// --- Service Provider Requests ---
export const getServiceProviderRequests = async () => {
  return await fetchAPI('/AdminDashboard/ServiceProviderRequests');
};

export const getAllServiceProviderRequests = async () => {
  return await fetchAPI('/AdminDashboard/ServiceProviderRequests');
};

export const approveServiceProviderRequest = async (id, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/ServiceProviderRequests/${id}/approve?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/ServiceProviderRequests/${id}/approve`;
  return await fetchAPI(url, {
    method: 'PATCH',
  });
};

export const rejectServiceProviderRequest = async (id, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/ServiceProviderRequests/${id}/reject?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/ServiceProviderRequests/${id}/reject`;
  return await fetchAPI(url, {
    method: 'PATCH',
  });
};

// --- Dashboard Statistics ---
export const getDashboardStatistics = async () => {
  return await fetchAPI('/AdminDashboard/Statistics');
};

// --- Flagged Users ---
export const getFlaggedUsers = async () => {
  return await fetchAPI('/AdminDashboard/FlaggedUsers');
};

export const getUserViolations = async (userId) => {
  return await fetchAPI(`/AdminDashboard/UserViolations/${userId}`);
};

export const suspendUser = async (userId, reason, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/SuspendUser/${userId}?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/SuspendUser/${userId}`;
  return await fetchAPI(url, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
};

export const reactivateUser = async (userId, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/ReactivateUser/${userId}?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/ReactivateUser/${userId}`;
  return await fetchAPI(url, {
    method: 'PUT',
  });
};

export const warnUser = async (userId, message, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/WarnUser/${userId}?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/WarnUser/${userId}`;
  return await fetchAPI(url, {
    method: 'PUT',
    body: JSON.stringify({ message }),
  });
};

// --- Product Moderation ---
export const getModerationStatistics = async () => {
  return await fetchAPI('/ProductModeration/Statistics');
};

export const getProductsForModeration = async (isActive = null, search = null, sellerId = null) => {
  let query = [];
  if (isActive !== null) query.push(`isActive=${isActive}`);
  if (search) query.push(`search=${encodeURIComponent(search)}`);
  if (sellerId) query.push(`sellerId=${sellerId}`);
  
  const queryString = query.length > 0 ? `?${query.join('&')}` : '';
  return await fetchAPI(`/ProductModeration/Products${queryString}`);
};

export const getProductDetails = async (id) => {
  return await fetchAPI(`/ProductModeration/Products/${id}`);
};

export const approveProduct = async (id, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/ProductModeration/Products/${id}/approve?adminUserProfileId=${adminUserProfileId}`
    : `/ProductModeration/Products/${id}/approve`;
  return await fetchAPI(url, {
    method: 'PUT',
  });
};

export const suspendProduct = async (id, reason, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/ProductModeration/Products/${id}/suspend?adminUserProfileId=${adminUserProfileId}`
    : `/ProductModeration/Products/${id}/suspend`;
  return await fetchAPI(url, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
};

export const deleteProducts = async (id) => {
  return await fetchAPI(`/ProductModeration/Products/${id}`, {
    method: 'DELETE',
  });
};

export const checkFlaggedKeywords = async (text) => {
  return await fetchAPI(`/ProductModeration/FlaggedKeywords?text=${encodeURIComponent(text)}`);
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
 * Get seller profile by UserProfileId
 * @param {number} userProfileId - User Profile ID
 * @returns {Promise<object|null>} - Seller object or null if not found
 */
export const getSellerByUserProfileId = async (userProfileId) => {
  try {
    // Use the new Profile endpoint we created
    return await fetchAPI(`/Sellers/Profile/${userProfileId}`);
  } catch (error) {
    console.warn('[API] Error fetching seller profile:', error);
    
    // Fallback to fetching all sellers if the endpoint fails
    try {
      const sellers = await fetchAPI('/Sellers');

      if (!sellers || !Array.isArray(sellers)) {
        return null;
      }

      // Find seller with matching UserProfileId
      const seller = sellers.find(s =>
        s.userProfileId === userProfileId ||
        s.UserProfileId === userProfileId ||
        s.userProfileId === parseInt(userProfileId) ||
        s.UserProfileId === parseInt(userProfileId)
      );

      return seller || null;
    } catch (fallbackError) {
      console.warn('[API] Fallback also failed:', fallbackError);
      return null;
    }
  }
};

/**
 * Get seller profile with full details including subcategories
 * @param {number} sellerId - Seller ID
 * @returns {Promise<object>} - Seller profile with subcategories
 */
export const getSellerProfile = async (sellerId, userProfileId) => {
  if (userProfileId) {
    return await fetchAPI(`/Sellers/Profile/${userProfileId}`);
  }
  // Fallback to regular sellers endpoint
  const sellers = await fetchAPI('/Sellers');
  return sellers.find(s => s.id === sellerId);
};

export const getSellerById = async (sellerId) => {
  const response = await fetch(`https://localhost:7062/api/Sellers/${sellerId}`);
  if (!response.ok) throw new Error("Failed to fetch seller");
  return response.json();
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


// Store Sections APIS

export const getStoreSections = async (sellerId) => {
  const res = await fetch(`${BASE_URL}/StoreSections/seller/${sellerId}`);
  if (!res.ok) throw new Error("Failed to fetch store sections");
  return res.json();
};

export const createStoreSection = async (sellerId, data) => {
  const res = await fetch(`${BASE_URL}/StoreSections?sellerId=${sellerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create section");
  return res.json();
};

export const updateStoreSection = async (id, data) => {
  const res = await fetch(`${BASE_URL}/StoreSections/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update section");
  return res.json();
};

export const deleteStoreSection = async (id) => {
  const res = await fetch(`${BASE_URL}/StoreSections/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete section");
};

// --- Product APIs ---

/**
 * Get all products
 * @returns {Promise<Array>} - Array of product objects
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
 * @param {object} data - Product payload
 *   Example: {
 *     sellerId,
 *     subCategoryId,
 *     name,
 *     description,
 *     basePrice,
 *     genderId,
 *     isActive
 *   }
 * @returns {Promise<object>} - Created product object
 */
export const createProduct = async (data) => {
  return await fetchAPI('/Products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update a product
 * @param {number} id - Product ID
 * @param {object} data - Updated product fields
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
 * @returns {Promise<null>} - Returns null on success
 */
export const deleteProduct = async (id) => {
  return await fetchAPI(`/Products/${id}`, {
    method: 'DELETE',
  });
};

// --- Service Providers ---
export const getServiceProviders = async () => {
  return await fetchAPI('/ServiceProviders');
};

export const getServiceProvider = async (id) => {
  return await fetchAPI(`/ServiceProviders/${id}`);
};

// Alias for consistency with other API naming conventions
export const getServiceProviderById = getServiceProvider;

/**
 * Get all services for a specific service provider
 * @param {number} serviceProviderId - Service Provider ID
 * @returns {Promise<Array>} - Array of service objects
 */
export const getServiceProviderServices = async (serviceProviderId) => {
  return await fetchAPI(`/ServiceProviders/${serviceProviderId}/services`);
};

export const createServiceProvider = async (data) => {
  return await fetchAPI('/ServiceProviders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateServiceProvider = async (id, data) => {
  return await fetchAPI(`/ServiceProviders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Get sellers for dropdown (Store selector)
 * @returns {Promise<Array>} - Array [{ id, storeName }]
 */
export const getSellerDropdown = async () => {
  return await fetchAPI('/Products/sellers-dropdown');
};

export const getSubCategoryDropdown = async () => {
  return await fetchAPI('/Products/subcategories-dropdown');
};

// --- Product Variant APIs ---

/**
 * Get color values for dropdown
 * @returns {Promise<Array>} - Array of color objects
 */
export const getColorValues = async () => {
  return await fetchAPI('/ProductVariants/colors');
};

/**
 * Get size values for dropdown
 * @returns {Promise<Array>} - Array of size objects
 */
export const getSizeValues = async () => {
  return await fetchAPI('/ProductVariants/sizes');
};

/**
 * Get all variants for a specific product
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} - Array of product variant objects
 */
export const getProductVariants = async (productId) => {
  return await fetchAPI(`/ProductVariants?productId=${productId}`);
};

/**
 * Create a new product variant
 * @param {object} data - Variant payload
 *   Example: {
 *     ProductId,
 *     ColorValue (optional string),
 *     SizeValue (optional string),
 *     SKU (optional),
 *     Price (optional, uses base price if null),
 *     StockQty
 *   }
 * @returns {Promise<object>} - Created variant object
 */
export const createProductVariant = async (data) => {
  return await fetchAPI('/ProductVariants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update a product variant
 * @param {number} id - Variant ID
 * @param {object} data - Updated variant fields
 * @returns {Promise<object>} - Updated variant object
 */
export const updateProductVariant = async (id, data) => {
  return await fetchAPI(`/ProductVariants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a product variant
 * @param {number} id - Variant ID to delete
 * @returns {Promise<null>} - Returns null on success
 */
export const deleteProductVariant = async (id) => {
  return await fetchAPI(`/ProductVariants/${id}`, {
    method: 'DELETE',
  });
};
// --- Category APIs ---

/**
 * Get all categories with subcategories
 * @returns {Promise<Array>} - Array of categories
 */
export const getCategories = async () => {
  return await fetchAPI('/Categories');
};

/**
 * Get a single category by ID
 * @param {number} id - Category ID
 * @returns {Promise<object>} - Category object
 */
export const getCategory = async (id) => {
  return await fetchAPI(`/Categories/${id}`);
};

/**
 * Create a new category
 * @param {object} data - Category data (PascalCase: Name, IsActive)
 * @returns {Promise<object>} - Created category object
 */
export const createCategory = async (data) => {
  return await fetchAPI('/Categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing category
 * @param {number} id - Category ID to update
 * @param {object} data - Updated category data
 * @returns {Promise<object>} - Updated category object
 */
export const updateCategory = async (id, data) => {
  return await fetchAPI(`/Categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a category
 * @param {number} id - Category ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteCategory = async (id) => {
  return await fetchAPI(`/Categories/${id}`, {
    method: 'DELETE',
  });
};

// --- SubCategory APIs ---

/**
 * Get all subcategories
 * @returns {Promise<Array>} - Array of subcategories
 */
export const getSubCategories = async () => {
  return await fetchAPI('/SubCategories');
};

/**
 * Get a single subcategory by ID
 * @param {number} id - SubCategory ID
 * @returns {Promise<object>} - SubCategory object
 */
export const getSubCategory = async (id) => {
  return await fetchAPI(`/SubCategories/${id}`);
};

/**
 * Create a new subcategory
 * @param {object} data - SubCategory data (PascalCase: Name, CategoryId, IsActive)
 * @returns {Promise<object>} - Created subcategory object
 */
export const createSubCategory = async (data) => {
  return await fetchAPI('/SubCategories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing subcategory
 * @param {number} id - SubCategory ID to update
 * @param {object} data - Updated subcategory data
 * @returns {Promise<object>} - Updated subcategory object
 */
export const updateSubCategory = async (id, data) => {
  return await fetchAPI(`/SubCategories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a subcategory
 * @param {number} id - SubCategory ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteSubCategory = async (id) => {
  return await fetchAPI(`/SubCategories/${id}`, {
    method: 'DELETE',
  });
};

// --- Order APIs ---

/**
 * Get all orders
 * @param {number} [customerId] - Optional: Filter by customer ID
 * @param {number} [sellerId] - Optional: Filter by seller ID
 * @returns {Promise<Array>} - Array of order objects with full details
 */
export const getOrders = async (customerId = null, sellerId = null) => {
  let url = '/Orders';
  const params = new URLSearchParams();
  
  if (customerId) params.append('customerId', customerId);
  if (sellerId) params.append('sellerId', sellerId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return await fetchAPI(url);
};

export const getOrderWithDetails = async (id, customerId) => {
  const res = await fetch(`https://localhost:7062/api/Orders?customerId=${customerId}`);
  return (await res.json()).find(o => o.id === id);
};


/**
 * Get a single order by ID
 * @param {number} id - Order ID
 * @returns {Promise<object>} - Order object with full details including items
 */
export const getOrder = async (id) => {
  return await fetchAPI(`/Orders/${id}`);
};

/**
 * Create a new order
 * @param {object} data - Order payload
 *   Example: {
 *     CustomerId: number,
 *     SellerId: number,
 *     DeliveryAddressId: number | null,
 *     PickupAddressId: number | null,
 *     PaymentMethod: string, // "Cash", "Card", "Online"
 *     PaymentStatus: string, // "Pending", "Paid", "Failed"
 *     FulfillmentType: string, // "Delivery", "Pickup"
 *     Status: string, // "Placed", "Processing", "Completed", "Cancelled"
 *     SubtotalAmount: number,
 *     DeliveryFee: number,
 *     TotalAmount: number
 *   }
 * @returns {Promise<object>} - Created order object
 */
export const createOrder = async (data) => {
  return await fetchAPI('/Orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an order (for status changes, payment updates)
 * @param {number} id - Order ID
 * @param {object} data - Updated order fields
 *   Example: {
 *     PaymentStatus: string,
 *     Status: string,
 *     DeliveryFee: number,
 *     TotalAmount: number
 *   }
 * @returns {Promise<null>} - Returns null on success
 */
export const updateOrder = async (id, data) => {
  return await fetchAPI(`/Orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete an order
 * @param {number} id - Order ID to delete
 * @returns {Promise<null>} - Returns null on success
 */
export const deleteOrder = async (id) => {
  return await fetchAPI(`/Orders/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Validate stock availability before placing order
 * @param {Array} items - Array of {ProductId, VariantId, Quantity}
 * @returns {Promise<object>} - Validation result
 */
export const validateStock = async (items) => {
  return await fetchAPI('/Orders/validate-stock', {
    method: 'POST',
    body: JSON.stringify(items),
  });
};

/**
 * Reserve stock for order items
 * @param {Array} items - Array of {ProductId, VariantId, Quantity}
 * @returns {Promise<void>}
 */
export const reserveStock = async (items) => {
  return await fetchAPI('/Orders/reserve-stock', {
    method: 'POST',
    body: JSON.stringify(items),
  });
};

/**
 * Restore stock when order is cancelled
 * @param {number} orderId - Order ID
 * @returns {Promise<void>}
 */
export const restoreStock = async (orderId) => {
  try {
    const response = await fetch(`https://localhost:7062/api/Orders/${orderId}/restore-stock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // If response is 204 No Content or empty, that's OK
    if (response.status === 204 || response.status === 200) {
      console.log('✅ Stock restored successfully');
      return { success: true };
    }

    // Try to parse JSON only if there's content
    const text = await response.text();
    if (text) {
      return JSON.parse(text);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to restore stock:', error);
    throw error;
  }
};


// --- Order Item APIs ---

/**
 * Get all order items
 * @param {number} [orderId] - Optional: Filter by order ID
 * @returns {Promise<Array>} - Array of order item objects
 */
export const getOrderItems = async (orderId = null) => {
  let url = '/OrderItems';
  
  if (orderId) {
    url += `?orderId=${orderId}`;
  }
  
  return await fetchAPI(url);
};

/**
 * Get a single order item by ID
 * @param {number} id - Order Item ID
 * @returns {Promise<object>} - Order item object with product details
 */
export const getOrderItem = async (id) => {
  return await fetchAPI(`/OrderItems/${id}`);
};

/**
 * Create a new order item
 * @param {object} data - Order item payload
 *   Example: {
 *     OrderId: number,
 *     ProductVariantId: number,
 *     Qty: number,
 *     UnitPrice: number
 *   }
 * @returns {Promise<object>} - Created order item object
 */
export const createOrderItem = async (data) => {
  return await fetchAPI('/OrderItems', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an order item (for quantity or price changes)
 * @param {number} id - Order Item ID
 * @param {object} data - Updated order item fields
 *   Example: {
 *     Qty: number,
 *     UnitPrice: number
 *   }
 * @returns {Promise<null>} - Returns null on success
 */
export const updateOrderItem = async (id, data) => {
  return await fetchAPI(`/OrderItems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete an order item
 * @param {number} id - Order Item ID to delete
 * @returns {Promise<null>} - Returns null on success
 */
export const deleteOrderItem = async (id) => {
  return await fetchAPI(`/OrderItems/${id}`, {
    method: 'DELETE',
  });
};

// --- Helper/Utility Functions ---

/**
 * Get orders for a specific customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} - Array of orders for the customer
 */
export const getCustomerOrders = async (customerId) => {
  return await getOrders(customerId, null);
};

/**
 * Get orders for a specific seller/store
 * @param {number} sellerId - Seller ID
 * @returns {Promise<Array>} - Array of orders for the seller
 */
export const getSellerOrders = async (sellerId) => {
  return await getOrders(null, sellerId);
};

/**
 * Get all items for a specific order
 * @param {number} orderId - Order ID
 * @returns {Promise<Array>} - Array of order items
 */
export const getOrderItemsByOrder = async (orderId) => {
  return await getOrderItems(orderId);
};

/**
 * Create a complete order with items (convenience function)
 * @param {object} orderData - Order data
 * @param {Array} items - Array of order items
 *   Example items: [{ ProductVariantId, Qty, UnitPrice }, ...]
 * @returns {Promise<object>} - Created order with items
 */
export const createCompleteOrder = async (orderData, items) => {
  try {
    // Create the order first
    const createdOrder = await createOrder(orderData);
    
    // Create all order items
    const itemPromises = items.map(item => 
      createOrderItem({
        OrderId: createdOrder.id,
        ProductVariantId: item.ProductVariantId,
        Qty: item.Qty,
        UnitPrice: item.UnitPrice
      })
    );
    
    const createdItems = await Promise.all(itemPromises);
    
    return {
      order: createdOrder,
      items: createdItems
    };
  } catch (error) {
    console.error('Error creating complete order:', error);
    throw error;
  }
};

// --- Review APIs ---

/**
 * Get all reviews
 * @param {number} [productId] - Optional: Filter by product ID
 * @param {number} [customerId] - Optional: Filter by customer ID
 * @returns {Promise<Array>} - Array of review objects
 */
export const getReviews = async (productId = null, customerId = null) => {
  let url = '/Reviews';
  const params = new URLSearchParams();
  
  if (productId) params.append('productId', productId);
  if (customerId) params.append('customerId', customerId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return await fetchAPI(url);
};

/**
 * Get a single review by ID
 * @param {number} id - Review ID
 * @returns {Promise<object>} - Review object with customer and product details
 */
export const getReview = async (id) => {
  return await fetchAPI(`/Reviews/${id}`);
};


/**
 * Create a new review
 * @param {object} data - Review payload
 *   Example: {
 *     OrderId: number,
 *     ProductId: number,
 *     CustomerId: number,
 *     Rating: number, // 1-5
 *     Comment: string
 *   }
 * @returns {Promise<object>} - Created review object
 */
export const createReview = async (data) => {
  return await fetchAPI('/Reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update a review (for hiding/unhiding by seller)
 * @param {number} id - Review ID
 * @param {object} data - Updated review fields
 *   Example: {
 *     IsCommentHiddenBySeller: boolean,
 *     HiddenReason: string
 *   }
 * @returns {Promise<null>} - Returns null on success
 */
export const updateReview = async (id, data) => {
  return await fetchAPI(`/Reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a review
 * @param {number} id - Review ID to delete
 * @returns {Promise<null>} - Returns null on success
 */
export const deleteReview = async (id) => {
  return await fetchAPI(`/Reviews/${id}`, {
    method: 'DELETE',
  });
};

// --- Helper/Utility Functions ---

/**
 * Get reviews for a specific product
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} - Array of reviews for the product
 */
export const getProductReviews = async (productId) => {
  return await getReviews(productId, null);
};

/**
 * Get reviews by a specific customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} - Array of reviews by the customer
 */
export const getCustomerReviews = async (customerId) => {
  return await getReviews(null, customerId);
};

/**
 * Hide a review (seller action)
 * @param {number} reviewId - Review ID
 * @param {string} reason - Reason for hiding the review
 * @returns {Promise<null>} - Returns null on success
 */
export const hideReview = async (reviewId, reason) => {
  return await updateReview(reviewId, {
    IsCommentHiddenBySeller: true,
    HiddenReason: reason
  });
};

/**
 * Unhide a review (seller action)
 * @param {number} reviewId - Review ID
 * @returns {Promise<null>} - Returns null on success
 */
export const unhideReview = async (reviewId) => {
  return await updateReview(reviewId, {
    IsCommentHiddenBySeller: false,
    HiddenReason: null
  });
};

// --- Customer APIs ---

/**
 * Get all customers
 * @returns {Promise<Array>} - Array of all customers
 */
export const getCustomers = async () => {
  return await fetchAPI('/Customers');
};

/**
 * Get a single customer by ID
 * @param {number} id - Customer ID
 * @returns {Promise<object>} - Customer object
 */
export const getCustomer = async (id) => {
  return await fetchAPI(`/Customers/${id}`);
};

/**
 * Get customer by UserProfileId
 * @param {number} userProfileId - UserProfile ID
 * @returns {Promise<object>} - Customer object
 */
export const getCustomerByUserProfileId = async (userProfileId) => {
  return await fetchAPI(`/Customers?userProfileId=${userProfileId}`);
};

/**
 * Create a new customer
 * @param {object} data - Customer data (PascalCase: UserProfileId, FullName, Phone)
 * @returns {Promise<object>} - Created customer object
 */
export const createCustomer = async (data) => {
  return await fetchAPI('/Customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing customer
 * @param {number} id - Customer ID to update
 * @param {object} data - Updated customer data
 * @returns {Promise<object>} - Updated customer object
 */
export const updateCustomer = async (id, data) => {
  return await fetchAPI(`/Customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a customer
 * @param {number} id - Customer ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteCustomer = async (id) => {
  return await fetchAPI(`/Customers/${id}`, {
    method: 'DELETE',
  });
};

// --- Address APIs ---
export const getAddresses = async () => {
  return await fetchAPI('/Addresses');
};

export const getAddress = async (id) => {
  return await fetchAPI(`/Addresses/${id}`);
};

export const createAddress = async (data) => {
  return await fetchAPI('/Addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAddress = async (id, data) => {
  return await fetchAPI(`/Addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAddress = async (id) => {
  return await fetchAPI(`/Addresses/${id}`, {
    method: 'DELETE',
  });
};

// --- CustomerAddress (linking customers to addresses) APIs ---
export const getCustomerAddresses = async () => {
  return await fetchAPI('/CustomerAddresses');
};

export const getCustomerAddress = async (id) => {
  return await fetchAPI(`/CustomerAddresses/${id}`);
};

export const createCustomerAddress = async (data) => {
  return await fetchAPI('/CustomerAddresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCustomerAddress = async (id, data) => {
  return await fetchAPI(`/CustomerAddresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCustomerAddress = async (id) => {
  return await fetchAPI(`/CustomerAddresses/${id}`, {
    method: 'DELETE',
  });
};

// --- SellerAddress (linking sellers to addresses) APIs ---
export const getSellerAddresses = async () => {
  return await fetchAPI('/SellerAddresses');
};

export const getSellerAddress = async (id) => {
  return await fetchAPI(`/SellerAddresses/${id}`);
};

/**
 * Get seller's address by seller ID
 * @param {number} sellerId - Seller ID
 * @returns {Promise<object>} - Seller address with address details
 */
export const getSellerAddressBySellerId = async (sellerId) => {
  return await fetchAPI(`/SellerAddresses/Seller/${sellerId}`);
};

export const createSellerAddress = async (data) => {
  return await fetchAPI('/SellerAddresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSellerAddress = async (id, data) => {
  return await fetchAPI(`/SellerAddresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteSellerAddress = async (id) => {
  return await fetchAPI(`/SellerAddresses/${id}`, {
    method: 'DELETE',
  });
};


// --- Driver APIs ---

/**
 * Get all drivers
 * @returns {Promise<Array>} - Array of all drivers
 */
export const getDrivers = async () => {
  return await fetchAPI('/Drivers');
};

/**
 * Get a single driver by ID
 * @param {number} id - Driver ID
 * @returns {Promise<object>} - Driver object
 */
export const getDriver = async (id) => {
  return await fetchAPI(`/Drivers/${id}`);
};

/**
 * Get driver profile by UserProfileId
 * WORKAROUND: Backend doesn't have a dedicated endpoint for this
 * @param {number} userProfileId - User Profile ID
 * @returns {Promise<object|null>} - Driver object or null if not found
 */
export const getDriverByUserProfileId = async (userProfileId) => {
  try {
    // Backend doesn't have /Drivers/Profile/{userProfileId} endpoint
    // Fetch all drivers and filter by UserProfileId
    const drivers = await fetchAPI('/Drivers');

    if (!drivers || !Array.isArray(drivers)) {
      return null;
    }

    // Find driver with matching UserProfileId (check both camelCase and PascalCase)
    const driver = drivers.find(d =>
      d.UserProfileId === userProfileId ||
      d.userProfileId === userProfileId ||
      d.UserProfileId === parseInt(userProfileId) ||
      d.userProfileId === parseInt(userProfileId)
    );

    return driver || null;
  } catch (error) {
    console.warn('[API] Error fetching drivers:', error);
    return null;
  }
};

/**
 * Create a new driver
 * @param {object} data - Driver data (PascalCase: UserProfileId, Phone, Status)
 * @returns {Promise<object>} - Created driver object
 */
export const createDriver = async (data) => {
  return await fetchAPI('/Drivers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing driver
 * @param {number} id - Driver ID
 * @param {object} data - Updated driver data
 * @returns {Promise<object>} - Updated driver object
 */
export const updateDriver = async (id, data) => {
  return await fetchAPI(`/Drivers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a driver
 * @param {number} id - Driver ID to delete
 * @returns {Promise<null>} - Returns null on successful deletion
 */
export const deleteDriver = async (id) => {
  return await fetchAPI(`/Drivers/${id}`, {
    method: 'DELETE',
  });
};


// --- Service Provider Dashboard ---

// Profile
export const getProviderProfile = async (userProfileId) => {
  try {
    // First try the dashboard endpoint (for logged-in service provider)
    return await fetchAPI(`/ServiceProviderDashboard/Profile/${userProfileId}`);
  } catch (error) {
    // If dashboard endpoint fails, fallback to fetching all providers and filtering
    try {
      const providers = await fetchAPI('/ServiceProviders');

      if (!providers || !Array.isArray(providers)) {
        return null;
      }

      // Find provider with matching UserProfileId (check both camelCase and PascalCase)
      const provider = providers.find(p =>
        p.UserProfileId === userProfileId ||
        p.userProfileId === userProfileId ||
        p.UserProfileId === parseInt(userProfileId) ||
        p.userProfileId === parseInt(userProfileId)
      );

      return provider || null;
    } catch (fallbackError) {
      console.warn('[API] Error fetching service providers:', fallbackError);
      return null;
    }
  }
};

export const updateProviderProfile = async (userProfileId, data) => {
  // Update user profile information via ServiceProviderDashboard endpoint
  return await fetchAPI(`/ServiceProviderDashboard/UpdateProfile/${userProfileId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const updateProviderStatus = async (serviceProviderId, status) => {
  // Update service provider status via ServiceProviderDashboard endpoint
  return await fetchAPI(`/ServiceProviderDashboard/UpdateStatus/${serviceProviderId}`, {
    method: 'PUT',
    body: JSON.stringify({ Status: status }),
  });
};

export const updateProviderAddress = async (serviceProviderId, data) => {
  // Update service provider address via ServiceProviderDashboard endpoint
  return await fetchAPI(`/ServiceProviderDashboard/UpdateAddress/${serviceProviderId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Categories & Services
export const getServiceCategories = async () => {
  return await fetchAPI('/ServiceProviderDashboard/Categories');
};

export const getProviderCategories = async (serviceProviderId) => {
  return await fetchAPI(`/ServiceProviderDashboard/ProviderCategories/${serviceProviderId}`);
};

export const getMyServices = async (serviceProviderId) => {
  return await fetchAPI(`/ServiceProviderDashboard/MyServices/${serviceProviderId}`);
};

export const addService = async (data) => {
  return await fetchAPI('/ServiceProviderDashboard/AddService', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateService = async (serviceCatalogId, data) => {
  return await fetchAPI(`/ServiceProviderDashboard/UpdateService/${serviceCatalogId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const toggleServiceStatus = async (serviceCatalogId) => {
  return await fetchAPI(`/ServiceProviderDashboard/ToggleService/${serviceCatalogId}`, {
    method: 'PUT',
  });
};

// Time Slots / Schedule
export const getProviderTimeSlots = async (serviceProviderId) => {
  return await fetchAPI(`/ServiceProviderDashboard/TimeSlots/${serviceProviderId}`);
};

export const addTimeSlot = async (data) => {
  return await fetchAPI('/ServiceProviderDashboard/AddTimeSlot', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const toggleTimeSlot = async (timeSlotId) => {
  return await fetchAPI(`/ServiceProviderDashboard/ToggleTimeSlot/${timeSlotId}`, {
    method: 'PUT',
  });
};

export const deleteTimeSlot = async (timeSlotId) => {
  return await fetchAPI(`/ServiceProviderDashboard/DeleteTimeSlot/${timeSlotId}`, {
    method: 'DELETE',
  });
};

// Bookings
export const getProviderBookings = async (serviceProviderId, status = null) => {
  const query = status ? `?status=${status}` : '';
  return await fetchAPI(`/ServiceProviderDashboard/Bookings/${serviceProviderId}${query}`);
};

export const updateBookingStatus = async (bookingId, data) => {
  return await fetchAPI(`/ServiceProviderDashboard/UpdateBookingStatus/${bookingId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Statistics
export const getProviderStatistics = async (serviceProviderId) => {
  return await fetchAPI(`/ServiceProviderDashboard/Statistics/${serviceProviderId}`);
};

// --- Universal User Profile APIs ---

/**
 * Get user profile for any user type
 * Routes to appropriate endpoint based on user role
 * @param {number} userId - User profile ID
 * @returns {Promise<object>} - User profile data
 */
export const getUserProfile = async (userId) => {
  // Using UserProfiles/Profile endpoint which works for all user types
  // Returns role-specific data based on the user's RoleType
  return await fetchAPI(`/UserProfiles/Profile/${userId}`);
};

/**
 * Update user profile for any user type
 * Routes to appropriate endpoint based on user role
 * @param {number} userId - User profile ID
 * @param {string} userRole - User role type (Admin, ServiceProvider, Seller, etc.)
 * @param {object} updates - Profile updates object
 * @returns {Promise<object>} - Updated profile data
 */
export const updateUserProfile = async (userId, userRole, updates) => {
  // Route profile updates based on role
  const profileUpdates = {
    DisplayName: updates.displayName,
    Phone: updates.phone,
  };

  // Add BusinessName for Service Providers
  if (userRole === 'ServiceProvider' && updates.businessName) {
    profileUpdates.BusinessName = updates.businessName;
  }

  // Route to appropriate endpoint based on role
  if (userRole === 'Customer') {
    await fetchAPI(`/Customers/UpdateProfile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    });
  } else if (userRole === 'ServiceProvider') {
    await fetchAPI(`/ServiceProviderDashboard/UpdateProfile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    });
  }

  // If address updates are provided and user has associated entity ID
  if (updates.address && updates.entityId) {
    const addressUpdates = {
      Street: updates.address.street,
      City: updates.address.city,
      Region: updates.address.region,
      PostalCode: updates.address.postalCode,
      Country: updates.address.country,
    };

    // Route address update based on role
    if (userRole === 'Customer') {
      await fetchAPI(`/Customers/UpdateAddress/${updates.entityId}`, {
        method: 'PUT',
        body: JSON.stringify(addressUpdates),
      });
    } else if (userRole === 'ServiceProvider') {
      await fetchAPI(`/ServiceProviderDashboard/UpdateAddress/${updates.entityId}`, {
        method: 'PUT',
        body: JSON.stringify(addressUpdates),
      });
    }
    // Add other role-specific address updates here if needed
  }

  // If status update is provided for service providers
  if (updates.status && updates.entityId && userRole === 'ServiceProvider') {
    await fetchAPI(`/ServiceProviderDashboard/UpdateStatus/${updates.entityId}`, {
      method: 'PUT',
      body: JSON.stringify({ Status: updates.status }),
    });
  }

  return { success: true };
};

// --- Delivery Ticket APIs ---

/**
 * Get all delivery tickets (with optional filters)
 * @param {object} params - Optional query parameters (driverId, status)
 * @returns {Promise<Array>} - Array of delivery tickets
 */
export const getDeliveryTickets = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return await fetchAPI(`/DeliveryTickets${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a single delivery ticket by ID
 * @param {number} id - Delivery ticket ID
 * @returns {Promise<object>} - Delivery ticket object with full details
 */
export const getDeliveryTicket = async (id) => {
  return await fetchAPI(`/DeliveryTickets/${id}`);
};

/**
 * Accept a delivery ticket and assign to driver
 * @param {number} id - Delivery ticket ID
 * @param {number} driverId - Driver ID accepting the ticket
 * @returns {Promise<object|null>} - Response or null for 204
 */
export const acceptDeliveryTicket = async (id, driverId) => {
  return await fetchAPI(`/DeliveryTickets/${id}/accept`, {
    method: 'PUT',
    body: JSON.stringify({ DriverId: driverId })
  });
};

/**
 * Update delivery ticket status (Picked Up, Delivered, etc.)
 * @param {number} id - Delivery ticket ID
 * @param {string} status - New status
 * @returns {Promise<object|null>} - Response or null for 204
 */
export const updateDeliveryStatus = async (id, status) => {
  return await fetchAPI(`/DeliveryTickets/${id}/update-status`, {
    method: 'PUT',
    body: JSON.stringify({ Status: status })
  });
};

// --- Seller Order Management APIs ---

/**
 * Seller responds to an order (Accept/Reject)
 * @param {number} orderId - Order ID
 * @param {string} status - Status (Accepted/Rejected)
 * @param {string|null} sellerNote - Optional note from seller
 * @returns {Promise<object|null>} - Response or null for 204
 */
export const sellerRespondToOrder = async (orderId, status, sellerNote = null) => {
  return await fetchAPI(`/Orders/${orderId}/seller-response`, {
    method: 'PUT',
    body: JSON.stringify({ Status: status, SellerNote: sellerNote })
  });
};

/**
 * Update seller order status (In Progress, Ready for Pickup, etc.)
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise<object|null>} - Response or null for 204
 */
export const updateSellerOrderStatus = async (orderId, status) => {
  return await fetchAPI(`/Orders/${orderId}/update-seller-status`, {
    method: 'PUT',
    body: JSON.stringify({ Status: status })
  });
};

// --- Authentication APIs ---

/**
 * User login
 *
 * Usage example:
 * ```javascript
 * import { login } from './services/api';
 *
 * try {
 *   const response = await login({
 *     Email: "user@example.com",
 *     Password: "password123"
 *   });
 *   console.log('Login successful:', response);
 *   // Store token: localStorage.setItem('authToken', response.Token);
 * } catch (error) {
 *   console.error('Login failed:', error.message);
 * }
 * ```
 *
 * @param {object} credentials - Login credentials
 *   Example: {
 *     Email: "user@example.com",
 *     Password: "password123"
 *   }
 * @returns {Promise<object>} - Login response
 *   {
 *     Token: "jwt_token_string",
 *     UserId: number,
 *     Role: "Customer" | "Seller" | "Admin" | "Driver" | "ServiceProvider"
 *   }
 * @throws {Error} - Throws error with message "Invalid credentials" on 401
 */
export const login = async (credentials) => {
  return await fetchAPI('/Auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

// --- Service Moderation APIs ---

/**
 * Get service moderation statistics
 * @returns {Promise<object>} - Service statistics
 */
export const getServiceModerationStatistics = async () => {
  return await fetchAPI('/ServiceModeration/Statistics');
};

/**
 * Get services for moderation with optional filters
 * @param {boolean|null} isActive - Filter by active status
 * @param {string|null} search - Search term
 * @returns {Promise<Array>} - Array of services
 */
export const getServicesForModeration = async (isActive = null, search = null) => {
  let query = [];
  if (isActive !== null) query.push(`isActive=${isActive}`);
  if (search) query.push(`search=${encodeURIComponent(search)}`);

  const queryString = query.length > 0 ? `?${query.join('&')}` : '';
  return await fetchAPI(`/ServiceModeration/Services${queryString}`);
};

/**
 * Get detailed service information
 * @param {number} id - Service ID
 * @returns {Promise<object>} - Service details
 */
export const getServiceDetails = async (id) => {
  return await fetchAPI(`/ServiceModeration/Services/${id}`);
};

/**
 * Approve a service
 * @param {number} id - Service ID
 * @returns {Promise<object>} - Response
 */
export const approveService = async (id, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/ServiceModeration/Services/${id}/approve?adminUserProfileId=${adminUserProfileId}`
    : `/ServiceModeration/Services/${id}/approve`;
  return await fetchAPI(url, {
    method: 'PUT',
  });
};

/**
 * Suspend a service with reason
 * @param {number} id - Service ID
 * @param {string} reason - Suspension reason
 * @param {number} adminUserProfileId - Admin user profile ID (optional)
 * @returns {Promise<object>} - Response
 */
export const suspendService = async (id, reason, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/ServiceModeration/Services/${id}/suspend?adminUserProfileId=${adminUserProfileId}`
    : `/ServiceModeration/Services/${id}/suspend`;
  return await fetchAPI(url, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
};

/**
 * Delete a service
 * @param {number} id - Service ID
 * @returns {Promise<object>} - Response
 */
export const deleteService = async (id) => {
  return await fetchAPI(`/ServiceModeration/Services/${id}`, {
    method: 'DELETE',
  });
};

/**
 * User registration
 *
 * Usage example:
 * ```javascript
 * import { register } from './services/api';
 *
 * const newUser = {
 *   Email: "user@example.com",
 *   Password: "password123",
 *   FirstName: "John",
 *   LastName: "Doe",
 *   PhoneNumber: "+1234567890"
 * };
 *
 * try {
 *   const response = await register(newUser);
 *   console.log('Registration successful:', response);
 * } catch (error) {
 *   console.error('Registration failed:', error.message);
 * }
 * ```
 *
 * @param {object} data - Registration data
 *   Example: {
 *     Email: "user@example.com",
 *     Password: "password123",
 *     FirstName: "John",
 *     LastName: "Doe",
 *     PhoneNumber: "+1234567890"
 *   }
 * @returns {Promise<object>} - Registration response
 *   {
 *     Message: "User registered successfully",
 *     UserId: "identity_user_id"
 *   }
 */
export const register = async (data) => {
  return await fetchAPI('/Auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// --- Service Review APIs ---

/**
 * Get all service reviews (optionally filtered by service provider)
 * @param {number} [serviceProviderId] - Optional: Filter by service provider ID
 * @returns {Promise<Array>} - Array of service review objects
 */
export const getServiceReviews = async (serviceProviderId = null) => {
  let url = '/ServiceReviews';
  if (serviceProviderId) {
    url = `/ServiceReviews/provider/${serviceProviderId}`;
  }
  return await fetchAPI(url);
};

/**
 * Get service reviews grouped by service for a service provider
 * @param {number} serviceProviderId - Service provider ID
 * @returns {Promise<Array>} - Array of service review objects
 */
export const getProviderServiceReviews = async (serviceProviderId) => {
  return await fetchAPI(`/ServiceReviews/provider/${serviceProviderId}`);
};

/**
 * Respond to a service review
 * @param {number} reviewId - Review ID
 * @param {string} response - Provider's response text
 * @returns {Promise<null>} - Returns null on success
 */
export const respondToServiceReview = async (reviewId, response) => {
  return await fetchAPI(`/ServiceReviews/${reviewId}/respond`, {
    method: 'PUT',
    body: JSON.stringify({ ProviderResponse: response }),
  });
};

/**
 * Toggle visibility of a service review (hide/unhide)
 * @param {number} reviewId - Review ID
 * @returns {Promise<null>} - Returns null on success
 */
export const toggleServiceReviewVisibility = async (reviewId) => {
  return await fetchAPI(`/ServiceReviews/${reviewId}/toggle-visibility`, {
    method: 'PUT',
  });
};

/**
 * Get service reviews by customer ID
 * Note: Backend doesn't have a customer endpoint, so we fetch all and filter
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} - Array of service review objects by the customer
 */
export const getCustomerServiceReviews = async (customerId) => {
  try {
    const allReviews = await fetchAPI('/ServiceReviews');
    // Filter reviews by customer ID
    return Array.isArray(allReviews)
      ? allReviews.filter(review => review.customerId === customerId)
      : [];
  } catch (error) {
    console.error('Error fetching customer service reviews:', error);
    return [];
  }
};

/**
 * Create a new service review
 * @param {Object} reviewData - Service review data
 *   Example: {
 *     serviceBookingId: number,
 *     serviceProviderId: number,
 *     customerId: number,
 *     overallRating: number, // 1-5
 *     qualityRating: number | null, // 1-5
 *     professionalismRating: number | null, // 1-5
 *     timelinessRating: number | null, // 1-5
 *     comment: string | null
 *   }
 * @returns {Promise<Object>} - Created service review object
 */
export const createServiceReview = async (reviewData) => {
  return await fetchAPI('/ServiceReviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
};

// Fetch all notifications for user
export const getUserNotifications = async (userId) => {
  return await fetchAPI(`/Notifications/user/${userId}`);
};

// Fetch unread count
export const getUnreadCount = async (userId) => {
  return await fetchAPI(`/Notifications/user/${userId}/unread/count`);
};

// Mark all notifications as read
export const markAllNotificationsRead = async (userId) => {
  return await fetchAPI(`/Notifications/user/${userId}/read-all`, {
    method: 'PUT',
  });
};

// Mark single notification as read
export const markNotificationRead = async (id) => {
  return await fetchAPI(`/Notifications/${id}/read`, {
    method: 'PUT',
  });
};

// Delete notification
export const deleteNotification = async (id) => {
  return await fetchAPI(`/Notifications/${id}`, {
    method: 'DELETE',
  });
};

// Fetch sent notifications for user
export const getSentNotifications = async (userId) => {
  return await fetchAPI(`/Notifications/user/${userId}/sent`);
};

// Create announcement
export const createAnnouncement = async (announcementData) => {
  return await fetchAPI('/Announcements', {
    method: 'POST',
    body: JSON.stringify(announcementData),
  });
};

// Get all announcements
export const getAnnouncements = async () => {
  return await fetchAPI('/Announcements');
};

// Get single announcement by ID
export const getAnnouncement = async (id) => {
  return await fetchAPI(`/Announcements/${id}`);
};

// Delete announcement
export const deleteAnnouncement = async (id) => {
  return await fetchAPI(`/Announcements/${id}`, {
    method: 'DELETE',
  });
};

// --- Service Category APIs ---

/**
 * Get all service categories
 * @returns {Promise<Array>} - Array of service categories
 */
export const getServiceCategoryList = async () => {
  return await fetchAPI('/ServiceCategories');
};

/**
 * Get a single service category by ID
 * @param {number} id - Service Category ID
 * @returns {Promise<object>} - Service Category object
 */
export const getServiceCategoryById = async (id) => {
  return await fetchAPI(`/ServiceCategories/${id}`);
};

/**
 * Create a new service category
 * @param {object} data - Service category data (Name, Description, IsActive)
 * @returns {Promise<object>} - Created service category
 */
export const createServiceCategory = async (data) => {
  return await fetchAPI('/ServiceCategories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing service category
 * @param {number} id - Service Category ID
 * @param {object} data - Updated service category data
 * @returns {Promise<void>}
 */
export const updateServiceCategory = async (id, data) => {
  return await fetchAPI(`/ServiceCategories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, Id: id }),
  });
};

// --- Service Catalog APIs ---

/**
 * Get all service catalogs
 * @param {number} [categoryId] - Optional: Filter by category ID
 * @returns {Promise<Array>} - Array of service catalogs
 */
export const getServiceCatalogs = async (categoryId = null) => {
  let url = '/ServiceCatalogs';
  if (categoryId) {
    url += `?categoryId=${categoryId}`;
  }
  return await fetchAPI(url);
};

/**
 * Get a single service catalog by ID
 * @param {number} id - Service Catalog ID
 * @returns {Promise<object>} - Service Catalog object
 */
export const getServiceCatalogById = async (id) => {
  return await fetchAPI(`/ServiceCatalogs/${id}`);
};

/**
 * Create a new service catalog
 * @param {object} data - Service catalog data (Name, Description, ServiceCategoryId, IsActive, etc.)
 * @returns {Promise<object>} - Created service catalog
 */
export const createServiceCatalog = async (data) => {
  return await fetchAPI('/ServiceCatalogs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing service catalog
 * @param {number} id - Service Catalog ID
 * @param {object} data - Updated service catalog data
 * @returns {Promise<void>}
 */
export const updateServiceCatalog = async (id, data) => {
  return await fetchAPI(`/ServiceCatalogs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, Id: id }),
  });
};

// ================== SERVICE BOOKING & TIME SLOTS API ==================

/**
 * Get time slots for a service provider
 * @param {number} serviceProviderId - Service provider ID
 * @returns {Promise<Array>} - Array of time slot objects
 */
export const getTimeSlots = async (serviceProviderId) => {
  return await fetchAPI(`/TimeSlots?serviceProviderId=${serviceProviderId}`);
};

/**
 * Get a single time slot by ID
 * @param {number} id - Time slot ID
 * @returns {Promise<Object>} - Time slot object
 */
export const getTimeSlot = async (id) => {
  return await fetchAPI(`/TimeSlots/${id}`);
};

/**
 * Create a new time slot
 * @param {object} data - Time slot payload
 * @returns {Promise<Object>} - Created time slot object
 */
export const createTimeSlot = async (data) => {
  return await fetchAPI('/TimeSlots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Get service bookings
 * @param {number} serviceProviderId - Optional service provider ID
 * @param {number} customerId - Optional customer ID
 * @returns {Promise<Array>} - Array of service booking objects
 */
export const getServiceBookings = async (serviceProviderId = null, customerId = null) => {
  let url = '/ServiceBookings';
  const params = [];

  if (serviceProviderId) params.push(`serviceProviderId=${serviceProviderId}`);
  if (customerId) params.push(`customerId=${customerId}`);

  if (params.length > 0) {
    url += '?' + params.join('&');
  }

  return await fetchAPI(url);
};

/**
 * Get a single service booking by ID
 * @param {number} id - Service booking ID
 * @returns {Promise<Object>} - Service booking object
 */
export const getServiceBooking = async (id) => {
  return await fetchAPI(`/ServiceBookings/${id}`);
};

/**
 * Create a new service booking
 * @param {object} data - Service booking payload
 * @returns {Promise<Object>} - Created service booking object
 */
export const createServiceBooking = async (data) => {
  return await fetchAPI('/ServiceBookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing service booking
 * @param {number} id - Service booking ID
 * @param {object} data - Updated booking data
 * @returns {Promise<Object>} - Updated service booking object
 */
export const updateServiceBooking = async (id, data) => {
  return await fetchAPI(`/ServiceBookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Cancel a service booking
 * @param {number} id - Service booking ID
 * @param {object} currentBooking - Current booking object with all fields
 * @param {string} canceledBy - Name of the person/system canceling
 * @param {string} cancellationReason - Reason for cancellation
 * @returns {Promise<Object>} - Updated service booking object
 */
export const cancelServiceBooking = async (id, currentBooking, canceledBy, cancellationReason) => {
  // Extract only the fields needed for the update
  // DO NOT send navigation properties (address, customer, serviceProvider, etc.)
  const cleanedBooking = {
    id: currentBooking.id,
    customerId: currentBooking.customerId,
    serviceProviderId: currentBooking.serviceProviderId,
    serviceCatalogId: currentBooking.serviceCatalogId,
    serviceId: currentBooking.serviceId || null,
    serviceAddressId: currentBooking.serviceAddressId,
    timeSlotId: currentBooking.timeSlotId,
    bookingDateTime: currentBooking.bookingDateTime,
    serviceType: currentBooking.serviceType,
    quotedPrice: currentBooking.quotedPrice || null,
    finalPrice: currentBooking.finalPrice || null,
    paymentType: currentBooking.paymentType,
    notes: currentBooking.notes,
    createdAt: currentBooking.createdAt,
    // Update status and cancellation fields
    status: 'Cancelled',
    canceledBy: canceledBy,
    cancellationReason: cancellationReason
  };

  return await fetchAPI(`/ServiceBookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedBooking),
  });
};

// ================== AUDIT LOGS API ==================

/**
 * Get all audit logs
 * @returns {Promise<Array>} - Array of audit log objects
 */
export const getAuditLogs = async () => {
  return await fetchAPI('/AuditLogs');
};

/**
 * Get a single audit log by ID
 * @param {number} id - Audit log ID
 * @returns {Promise<Object>} - Audit log object
 */
export const getAuditLog = async (id) => {
  return await fetchAPI(`/AuditLogs/${id}`);
};
