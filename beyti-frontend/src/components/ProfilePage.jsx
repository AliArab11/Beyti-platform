/**
 * Universal Profile Page Component
 *
 * Displays and allows editing of user profile information
 * Works for all user types: Admin, ServiceProvider, Seller, Driver, Customer
 */

import { useState, useEffect, useRef } from 'react';
import { User, Envelope, Phone, MapPin, Calendar, IdentificationCard, CheckCircle, XCircle, Buildings, Tag, X, Camera, Upload  } from '@phosphor-icons/react';

import ConfirmModal from './ConfirmModal'; 
import { formatTime } from '../Beyti-Website/Seller/Components/storeStatus';

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

  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);


  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [searchSubCategory, setSearchSubCategory] = useState('');

// Initialize form data when userProfile changes
useEffect(() => {
  if (userProfile) {
    console.log('👤 ProfilePage received userProfile:', userProfile);
    
    // Helper to convert "HH:MM:SS" to "HH:MM" for input
    const formatTimeForInput = (timeStr) => {
      if (!timeStr) return '';
      const parts = timeStr.split(':');
      return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
    };

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

    // Set image preview if exists
    if (userRole === 'Seller' && userProfile.storeImageUrl) {
      setImagePreview(userProfile.storeImageUrl);
    }

    console.log('🔄 Updated states - isManuallyClosed:', userProfile.isManuallyClosed, 'isForceOpen:', userProfile.isForceOpen);

    // Load subcategories for sellers
    if (userRole === 'Seller' && userProfile.categoryId) {
      loadSubCategories(userProfile.categoryId);
      
      // Set the selected subcategories from props
      if (userProfile.subCategoryIds && Array.isArray(userProfile.subCategoryIds)) {
        console.log('🏷️ Setting subcategories:', userProfile.subCategoryIds);
        setSelectedSubCategories(userProfile.subCategoryIds);
      } else {
        console.log('⚠️ No subcategories found in userProfile');
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

  const handleImageUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (PNG or JPG)');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB');
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setImagePreview(reader.result);
  };
  reader.readAsDataURL(file);
};

const handleSaveImage = async () => {
  if (!imagePreview || !entityId) {
    alert('No image to save');
    return;
  }

  setUploadingImage(true);

  try {
    const response = await fetch(`https://localhost:7062/api/Sellers/${entityId}/store-image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: imagePreview })
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    setSaveMessage({ type: 'success', text: 'Store logo updated successfully!' });
    setShowImageModal(false);

    // Trigger parent refresh
    if (onProfileUpdate) {
      await onProfileUpdate({ forceRefresh: true });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    setSaveMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
  } finally {
    setUploadingImage(false);
  }
};

const handleRemoveImage = async () => {
  if (!entityId) return;

  setUploadingImage(true);

  try {
    const response = await fetch(`https://localhost:7062/api/Sellers/${entityId}/store-image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: null })
    });

    if (!response.ok) {
      throw new Error('Failed to remove image');
    }

    setImagePreview(null);
    setSaveMessage({ type: 'success', text: 'Store logo removed successfully!' });
    setShowImageModal(false);

    // Trigger parent refresh
    if (onProfileUpdate) {
      await onProfileUpdate({ forceRefresh: true });
    }
  } catch (error) {
    console.error('Error removing image:', error);
    setSaveMessage({ type: 'error', text: 'Failed to remove image. Please try again.' });
  } finally {
    setUploadingImage(false);
  }
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

const handleToggleStoreStatus = async () => {
  setIsTogglingStore(true);
  
  try {
    const response = await fetch(`https://localhost:7062/api/Sellers/${entityId}/toggle-store-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Toggle response:', data);
      
      // Update local state
      setIsOpen(data.isOpen);
      
      // Trigger parent reload
      if (onProfileUpdate) {
        await onProfileUpdate({ 
          forceRefresh: true,
          isOpen: data.isOpen
        });
      }
    }
  } catch (error) {
    console.error('❌ Error toggling store status:', error);
  } finally {
    setIsTogglingStore(false);
  }
};

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
      default:
        return 'bg-grey-300 text-charcoal-600 dark:bg-charcoal-400 dark:text-cream-50';
    }
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
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-grey-200 dark:bg-[#2A2A2A] border-4 border-grey-200 dark:border-[#2A2A2A] shadow-soft-lift dark:shadow-none flex items-center justify-center transition-colors overflow-hidden">
                  {userRole === 'Seller' && imagePreview ? (
                    <img 
                      src={imagePreview.startsWith('data:') ? imagePreview : `https://localhost:7062${imagePreview}`} 
                      alt="Store Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-sage-500 flex items-center justify-center">
                      <User size={64} weight="fill" className="text-sage-100" />
                    </div>
                  )}
                </div>
                {userRole === 'Seller' && !readOnly && (
                  <button
                    onClick={() => setShowImageModal(true)}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-sage-500 hover:bg-sage-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    title={imagePreview ? "Edit Logo" : "Add Logo"}
                  >
                    <Camera size={20} weight="bold" />
                  </button>
                )}
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold">Store Categories</h2>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mt-1">
                  Select up to 3 subcategories that best describe your store
                </p>
              </div>
              {!isEditing && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800">
                  <Tag size={18} className="text-sage-600 dark:text-sage-400" />
                  <span className="text-sm font-semibold text-sage-700 dark:text-sage-300">
                    {selectedSubCategories.length} / 3
                  </span>
                </div>
              )}
            </div>

            {!isEditing ? (
              /* View Mode - Show selected chips with beautiful styling */
              <div>
                {selectedSubCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {availableSubCategories
                      .filter(sc => selectedSubCategories.includes(sc.id))
                      .map(sc => (
                        <div
                          key={sc.id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sage-500 dark:bg-sage-600 text-white text-sm font-semibold shadow-md border-2 border-sage-600 dark:border-sage-700"
                        >
                          <Tag size={16} weight="fill" />
                          {sc.name}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 bg-grey-100 dark:bg-charcoal-600 rounded-lg border-2 border-dashed border-grey-stroke dark:border-charcoal-500">
                    <div className="w-16 h-16 rounded-full bg-grey-200 dark:bg-charcoal-500 flex items-center justify-center mb-4">
                      <Tag size={32} className="text-charcoal-400 dark:text-charcoal-300" />
                    </div>
                    <p className="text-body-medium text-charcoal-500 dark:text-charcoal-300 font-medium mb-1">
                      No categories selected yet
                    </p>
                    <p className="text-label-small text-charcoal-400 dark:text-gray-400">
                      Click "Edit Profile" to add categories
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode - Show searchable chips with enhanced interactivity */
              <div className="space-y-5">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchSubCategory}
                    onChange={(e) => setSearchSubCategory(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full px-4 py-3 pl-11 border-2 border-grey-stroke dark:border-charcoal-500 dark:bg-charcoal-600 rounded-lg text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                  />
                  <Tag size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-300" />
                </div>

                {/* Selection Counter with Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-600 dark:text-charcoal-200 font-medium">
                      {selectedSubCategories.length} of 3 selected
                    </span>
                    {selectedSubCategories.length >= 3 && (
                      <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Maximum reached
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-grey-200 dark:bg-charcoal-500 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sage-500 dark:bg-sage-600 transition-all duration-300 ease-out"
                      style={{ width: `${(selectedSubCategories.length / 3) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Chips Grid with Enhanced Styling */}
                {loadingSubCategories ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-sage-500 border-t-transparent mx-auto"></div>
                    <p className="text-sm text-charcoal-400 dark:text-charcoal-300 mt-3">Loading categories...</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
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
                            inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                            transition-all duration-200 transform
                            ${isSelected
                              ? 'bg-sage-500 dark:bg-sage-600 text-white shadow-md border-2 border-sage-600 dark:border-sage-700 scale-105'
                              : isDisabled
                              ? 'bg-grey-100 dark:bg-charcoal-500/50 text-charcoal-300 dark:text-charcoal-400 cursor-not-allowed opacity-50 border-2 border-transparent'
                              : 'bg-white dark:bg-charcoal-500 text-charcoal-600 dark:text-white hover:bg-sage-50 dark:hover:bg-sage-900/30 hover:border-sage-300 dark:hover:border-sage-700 hover:scale-105 border-2 border-grey-stroke dark:border-charcoal-400 shadow-sm'
                            }
                          `}
                        >
                          {isSelected && <Tag size={16} weight="fill" />}
                          {sc.name}
                          {isSelected && (
                            <X size={16} weight="bold" className="ml-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredSubCategories.length === 0 && !loadingSubCategories && (
                  <div className="text-center py-8 bg-grey-100 dark:bg-charcoal-600 rounded-lg border border-grey-stroke dark:border-charcoal-500">
                    <p className="text-charcoal-500 dark:text-charcoal-300 font-medium">
                      No categories match your search
                    </p>
                    <p className="text-sm text-charcoal-400 dark:text-gray-400 mt-1">
                      Try a different search term
                    </p>
                  </div>
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-medium font-medium w-fit ${getStatusBadgeColor(userProfile.status)}`}>
              {userProfile.status}
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

      {/* Store Image Upload Modal - Only for Sellers */}
        {userRole === 'Seller' && showImageModal && (
          <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-charcoal-600 dark:text-white">
                    {imagePreview ? 'Edit Store Logo' : 'Add Store Logo'}
                  </h3>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="p-2 hover:bg-grey-100 dark:hover:bg-charcoal-600 rounded-full transition-colors"
                  >
                    <X size={20} weight="bold" className="text-charcoal-600 dark:text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Image Preview */}
                <div className="mb-6">
                  <div className="w-full aspect-square rounded-xl border-2 border-dashed border-grey-stroke dark:border-charcoal-500 flex items-center justify-center overflow-hidden bg-grey-100 dark:bg-charcoal-600">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <Upload size={48} className="mx-auto mb-3 text-charcoal-400 dark:text-charcoal-300" />
                        <p className="text-sm text-charcoal-400 dark:text-charcoal-300">
                          No image selected
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mb-3 px-4 py-3 bg-sage-100 dark:bg-sage-900 hover:bg-sage-200 dark:hover:bg-sage-800 text-sage-700 dark:text-sage-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={20} weight="bold" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </button>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {imagePreview && (
                    <button
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                      className="flex-1 px-4 py-3 bg-error-bg hover:bg-error-bg/80 text-error-text rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      Remove Image
                    </button>
                  )}
                  <button
                    onClick={handleSaveImage}
                    disabled={!imagePreview || uploadingImage}
                    className="flex-1 px-4 py-3 bg-sage-500 hover:bg-sage-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Logo'
                    )}
                  </button>
                </div>

                <p className="text-xs text-charcoal-400 dark:text-charcoal-300 mt-3 text-center">
                  Supported formats: PNG, JPG • Max size: 5MB
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
