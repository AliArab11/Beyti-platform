/**
 * Universal Profile Page Component
 *
 * Displays and allows editing of user profile information
 * Works for all user types: Admin, ServiceProvider, Seller, Driver, Customer
 */

import { useState, useEffect } from 'react';
import { User, Envelope, Phone, MapPin, Calendar, IdentificationCard, CheckCircle, XCircle, Buildings, Tag, X  } from '@phosphor-icons/react';

export default function ProfilePage({
  userProfile,
  userRole = 'User',
  entityId = null, // Service Provider ID, Seller ID, etc.
  onProfileUpdate,
  readOnly = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    businessName: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Bahrain'
  });

  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [searchSubCategory, setSearchSubCategory] = useState('');

  // Initialize form data when userProfile changes
useEffect(() => {
  if (userProfile) {
    setFormData({
      displayName: userProfile.displayName || '',
      businessName: userProfile.businessName || '',
      phone: userProfile.phone || '',
      street: userProfile.street || '',
      city: userProfile.city || '',
      region: userProfile.region || '',
      postalCode: userProfile.postalCode || '',
      country: userProfile.country || 'Bahrain'
    });

    // Load subcategories for sellers
    if (userRole === 'Seller' && userProfile.categoryId) {
      loadSubCategories(userProfile.categoryId);
      if (userProfile.subCategoryIds) {
        setSelectedSubCategories(userProfile.subCategoryIds);
      }
    }
  }
}, [userProfile, userRole]);

// Add this new function right after the useEffect:
const loadSubCategories = async (categoryId) => {
  setLoadingSubCategories(true);
  try {
    const response = await fetch(`https://localhost:7062/api/SubCategories/ByCategory/${categoryId}`);
    if (response.ok) {
      const data = await response.json();
      setAvailableSubCategories(data);
    }
  } catch (error) {
    console.error('Error loading subcategories:', error);
  } finally {
    setLoadingSubCategories(false);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Build the updates object
      const updates = {
        displayName: formData.displayName,
        phone: formData.phone,
      };

      // Add business name for Service Providers
      if (userRole === 'ServiceProvider' && formData.businessName) {
        updates.businessName = formData.businessName;
      }

      // Add address updates if any field has changed
      const hasAddressChanged =
        formData.street !== (userProfile.street || '') ||
        formData.city !== (userProfile.city || '') ||
        formData.region !== (userProfile.region || '') ||
        formData.postalCode !== (userProfile.postalCode || '') ||
        formData.country !== (userProfile.country || 'Bahrain');

      if (hasAddressChanged) {
        updates.address = {
          street: formData.street,
          city: formData.city,
          region: formData.region,
          postalCode: formData.postalCode,
          country: formData.country
        };
        updates.entityId = entityId; // Include entity ID for address updates
      }

     // Update subcategories for sellers
      if (userRole === 'Seller' && entityId) {
        try {
          const subCatResponse = await fetch(`https://localhost:7062/api/Sellers/${entityId}/subcategories`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedSubCategories)
          });

          if (!subCatResponse.ok) {
            const errorData = await subCatResponse.json();
            throw new Error(errorData.message || 'Failed to update subcategories');
          }
        } catch (error) {
          console.error('Error updating subcategories:', error);
          throw error;
        }
      }

      // Call the parent's update handler
      if (onProfileUpdate) {
        await onProfileUpdate(updates);
      }

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {

     // Reset subcategories for sellers
  if (userRole === 'Seller' && userProfile.subCategoryIds) {
    setSelectedSubCategories(userProfile.subCategoryIds);
  }
  setSearchSubCategory('');

    // Reset form data to original values
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        businessName: userProfile.businessName || '',
        phone: userProfile.phone || '',
        street: userProfile.street || '',
        city: userProfile.city || '',
        region: userProfile.region || '',
        postalCode: userProfile.postalCode || '',
        country: userProfile.country || 'Bahrain'
      });
    }
    setIsEditing(false);
    setSaveMessage(null);
  };

  const toggleSubCategory = (subCategoryId) => {
  setSelectedSubCategories(prev => {
    if (prev.includes(subCategoryId)) {
      return prev.filter(id => id !== subCategoryId);
    } else {
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, subCategoryId];
    }
  });
};

const filteredSubCategories = availableSubCategories.filter(sc =>
  sc.name.toLowerCase().includes(searchSubCategory.toLowerCase())
);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-success-bg text-success-text';
      case 'Inactive':
        return 'bg-error-bg text-error-text';
      case 'Suspended':
        return 'bg-error-bg text-error-text';
      default:
        return 'bg-grey-300 text-charcoal-600 dark:bg-charcoal-400 dark:text-cream-50';
    }
  };

  // Determine account status based on user role
  const getAccountStatus = () => {
    // For Service Providers, account status is always based on accountStatus field
    // For Customers, show accountStatus field which should be Active/Inactive
    // Service Providers have a separate 'status' field for availability (Available/Busy/Unavailable)
    if (userRole === 'ServiceProvider') {
      return userProfile.accountStatus || 'Active';
    }
    // For all other roles (Customer, Admin, etc.), show accountStatus
    return userProfile.accountStatus || userProfile.status || 'Active';
  };

  // Check if this user role should show phone and address fields
  const showContactFields = userRole !== 'Admin' && userRole !== 'Super Admin';

  return (
    <div className="space-y-6">
      {/* Save Message */}
      {saveMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-md ${
          saveMessage.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-error-bg text-error-text'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle size={24} weight="fill" />
          ) : (
            <XCircle size={24} weight="fill" />
          )}
          <span className="text-body-regular font-medium">{saveMessage.text}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none overflow-hidden transition-colors">
        <div className="h-32 bg-gradient-to-r from-sage-500 to-sage-700"></div>
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-16 mb-6">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 rounded-full bg-grey-200 dark:bg-[#2A2A2A] border-4 border-grey-200 dark:border-[#2A2A2A] shadow-soft-lift dark:shadow-none flex items-center justify-center transition-colors">
                <div className="w-full h-full rounded-full bg-sage-500 flex items-center justify-center">
                  <User size={64} weight="fill" className="text-sage-100" />
                </div>
              </div>
              <div className="pb-2">
                <h1 className="text-display-h2 text-charcoal-600 dark:text-white font-semibold">
                  {formData.displayName || 'User Profile'}
                </h1>
                <p className="text-body-large text-charcoal-400 dark:text-gray-400 mt-1">{userRole}</p>
              </div>
            </div>
            {!readOnly && (
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-6 py-2.5 border border-grey-stroke dark:border-charcoal-500 text-charcoal-600 dark:text-white rounded-md hover:bg-grey-300 dark:hover:bg-[#2A2A2A] transition-colors text-body-regular font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-sage-500 text-white rounded-md hover:bg-sage-700 transition-colors text-body-regular font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-sage-500 text-white rounded-md hover:bg-sage-700 transition-colors text-body-regular font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information Card */}
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold mb-6">Personal Information</h2>

          <div className="space-y-4">
            {/* Display Name */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-sage-900 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={20} className="text-sage-700 dark:text-sage-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Display Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                    placeholder="Enter your display name"
                  />
                ) : (
                  <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                    {formData.displayName || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {/* Business Name - Only show for Service Providers */}
            {userRole === 'ServiceProvider' && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-sage-900 flex items-center justify-center flex-shrink-0 mt-1">
                  <Buildings size={20} className="text-sage-700 dark:text-sage-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Business Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                      placeholder="Enter your business name"
                    />
                  ) : (
                    <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                      {formData.businessName || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Phone - Only show for non-Admin users */}
            {showContactFields && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-sage-900 flex items-center justify-center flex-shrink-0 mt-1">
                  <Phone size={20} className="text-sage-700 dark:text-sage-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Phone Number</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                      {formData.phone || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact & Address Card */}
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold mb-6">Contact & Details</h2>

          <div className="space-y-4">
            {/* Address - Only show for non-Admin users */}
            {showContactFields && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-sage-900 flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin size={20} className="text-sage-700 dark:text-sage-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Address</p>
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Street */}
                      <div>
                        <label className="text-label-small text-charcoal-500 dark:text-charcoal-300 mb-1 block">Street</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                          placeholder="Enter street address"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="text-label-small text-charcoal-500 dark:text-charcoal-300 mb-1 block">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                          placeholder="Enter city"
                        />
                      </div>

                      {/* Region */}
                      <div>
                        <label className="text-label-small text-charcoal-500 dark:text-charcoal-300 mb-1 block">Region</label>
                        <input
                          type="text"
                          name="region"
                          value={formData.region}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                          placeholder="Enter region/state"
                        />
                      </div>

                      {/* Postal Code */}
                      <div>
                        <label className="text-label-small text-charcoal-500 dark:text-charcoal-300 mb-1 block">Postal Code (Optional)</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                          placeholder="Enter postal code"
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className="text-label-small text-charcoal-500 dark:text-charcoal-300 mb-1 block">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                      {(() => {
                        // Try to use pre-formatted address first
                        if (userProfile.address) {
                          return userProfile.address;
                        }
                        // Otherwise, construct from individual fields
                        const parts = [
                          userProfile.street,
                          userProfile.city,
                          userProfile.region,
                          userProfile.postalCode,
                          userProfile.country
                        ].filter(Boolean);

                        if (parts.length > 0) {
                          return parts.join(', ');
                        }

                        return <span className="text-charcoal-400 dark:text-gray-400">No address provided</span>;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Profile ID */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-sage-900 flex items-center justify-center flex-shrink-0 mt-1">
                <IdentificationCard size={20} className="text-sage-700 dark:text-sage-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">User ID</p>
                <p className="text-body-regular text-charcoal-600 dark:text-white font-medium font-mono">
                  {userProfile.userProfileId || userProfile.id || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Categories Section - Only for Sellers */}
        {userRole === 'Seller' && (
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold">Store Categories</h2>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mt-1">
                  Select up to 3 subcategories that best describe your store
                </p>
              </div>
              {!isEditing && (
                <div className="flex items-center gap-2">
                  <Tag size={20} className="text-sage-600" />
                  <span className="text-label-medium text-charcoal-500 dark:text-charcoal-300">
                    {selectedSubCategories.length} / 3 selected
                  </span>
                </div>
              )}
            </div>

            {!isEditing ? (
              /* View Mode - Show selected chips */
              <div>
                {selectedSubCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSubCategories
                      .filter(sc => selectedSubCategories.includes(sc.id))
                      .map(sc => (
                        <div
                          key={sc.id}
                          className="inline-flex items-center px-4 py-2 rounded-full bg-sage-100 dark:bg-sage-900 text-sage-700 dark:text-sage-300 text-sm font-medium"
                        >
                          {sc.name}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                    No categories selected yet
                  </p>
                )}
              </div>
            ) : (
              /* Edit Mode - Show searchable chips */
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchSubCategory}
                    onChange={(e) => setSearchSubCategory(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full px-4 py-2 pl-10 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-lg text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                  />
                  <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                </div>

                {/* Selection Counter */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-charcoal-500 dark:text-charcoal-300">
                    {selectedSubCategories.length} / 3 selected
                  </span>
                  {selectedSubCategories.length >= 3 && (
                    <span className="text-orange-600 font-medium">
                      Maximum reached
                    </span>
                  )}
                </div>

                {/* Chips Grid */}
                {loadingSubCategories ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500 mx-auto"></div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredSubCategories.map(sc => {
                      const isSelected = selectedSubCategories.includes(sc.id);
                      const isDisabled = !isSelected && selectedSubCategories.length >= 3;
                      
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => !isDisabled && toggleSubCategory(sc.id)}
                          disabled={isDisabled}
                          className={`
                            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                            transition-all cursor-pointer
                            ${isSelected
                              ? 'bg-sage-500 text-white hover:bg-sage-600'
                              : isDisabled
                              ? 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-400 cursor-not-allowed opacity-50'
                              : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-white hover:bg-sage-100 dark:hover:bg-sage-900'
                            }
                          `}
                        >
                          {sc.name}
                          {isSelected && <X size={16} weight="bold" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredSubCategories.length === 0 && (
                  <p className="text-center text-charcoal-400 dark:text-gray-400 py-4">
                    No categories found
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      {/* Account Information Card */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none p-6 transition-colors">
        <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold mb-6">Account Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Created At */}
          {userProfile.createdAt && (
            <div className="flex flex-col">
              <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Member Since</p>
              <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Updated At */}
          {userProfile.updatedAt && (
            <div className="flex flex-col">
              <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Last Updated</p>
              <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                {new Date(userProfile.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Account Status */}
          <div className="flex flex-col">
            <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Account Status</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-medium font-medium w-fit ${getStatusBadgeColor(getAccountStatus())}`}>
              {getAccountStatus()}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Information Card */}
      {(userProfile.bio || userProfile.specialization || userProfile.yearsOfExperience) && (
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold mb-6">Professional Details</h2>

          <div className="space-y-4">
            {userProfile.specialization && (
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Specialization</p>
                <p className="text-body-regular text-charcoal-600 dark:text-white">
                  {userProfile.specialization}
                </p>
              </div>
            )}

            {userProfile.yearsOfExperience && (
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Years of Experience</p>
                <p className="text-body-regular text-charcoal-600 dark:text-white">
                  {userProfile.yearsOfExperience} years
                </p>
              </div>
            )}

            {userProfile.bio && (
              <div>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Bio</p>
                <p className="text-body-regular text-charcoal-600 dark:text-white leading-relaxed">
                  {userProfile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
