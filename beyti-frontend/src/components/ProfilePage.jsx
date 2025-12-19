/**
 * Universal Profile Page Component
 *
 * Displays and allows editing of user profile information
 * Works for all user types: Admin, ServiceProvider, Seller, Driver, Customer
 */

import { useState, useEffect, useRef } from 'react';
import { User, Envelope, Phone, MapPin, Calendar, IdentificationCard, CheckCircle, XCircle, Buildings, Tag, X, Camera, Upload, Trash  } from '@phosphor-icons/react';

import ConfirmModal from './ConfirmModal'; 
import { formatTime } from '../Beyti-Website/Seller/Components/storeStatus';
import Cropper from 'react-easy-crop';
import Snackbar from './Snackbar';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function ProfilePage({
  userProfile,
  userRole = 'User',
  entityId = null, // Service Provider ID, Seller ID, etc.
  onProfileUpdate,
  readOnly = false,
  customerAddresses = [] // ADD THIS
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
    country: 'Bahrain',
    storeDescription: ''
  });

  // Snackbar state
const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

const showSnackbar = (message, type = 'success') => {
  setSnackbar({ open: true, message, type });
  setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 5000);
};

// Confirm modal state
const [confirmModal, setConfirmModal] = useState({ 
  isOpen: false, 
  title: '', 
  message: '', 
  onConfirm: null,
  variant: 'danger'
});

  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

    // Address modal states - THESE ARE MISSING
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);
  const [addressError, setAddressError] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressWasModified, setAddressWasModified] = useState(false); 

  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
  setCroppedAreaPixels(croppedAreaPixels);
};

const createCroppedImage = async () => {
  try {
    const image = new Image();
    image.src = imagePreview;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return canvas.toDataURL('image/jpeg');
  } catch (error) {
    console.error('Error cropping image:', error);
    return null;
  }
};


  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [searchSubCategory, setSearchSubCategory] = useState('');

  // Address state (seller has ONE address)
  const [currentAddress, setCurrentAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

// Initialize form data when userProfile changes
useEffect(() => {
  if (userProfile) {
    console.log('👤 ProfilePage received userProfile:', userProfile);
    
    // Only reset form data if NOT currently editing
    if (!isEditing) {
      setFormData({
        displayName: userProfile.displayName || '',
        businessName: userProfile.businessName || '',
        phone: userProfile.phone || '',
        street: userProfile.street || '',
        city: userProfile.city || '',
        region: userProfile.region || '',
        postalCode: userProfile.postalCode || '',
        country: userProfile.country || 'Bahrain',
        storeDescription: userProfile.storeDescription || ''
      });
    }

    // Load subcategories for sellers
    if (userRole === 'Seller' && userProfile.categoryId) {
      loadSubCategories(userProfile.categoryId);
      
      if (userProfile.subCategoryIds && Array.isArray(userProfile.subCategoryIds)) {
        setSelectedSubCategories(userProfile.subCategoryIds);
      }
    }
    
    // Load seller's address (only if not editing)
    if (userRole === 'Seller' && entityId && !isEditing) {
      loadSellerAddress();
    }
  }
}, [userProfile, userRole, entityId]); // Removed isEditing from dependencies

// Initialize image preview
useEffect(() => {
  if (userProfile?.storeImageUrl) {
    setImagePreview(`https://localhost:7062${userProfile.storeImageUrl}`);
  } else {
    setImagePreview(null);
  }
}, [userProfile]);



// Initialize image preview from userProfile
useEffect(() => {
  if (userProfile?.storeImageUrl) {
    setImagePreview(`https://localhost:7062${userProfile.storeImageUrl}`);
  } else {
    setImagePreview(null);
  }
}, [userProfile]);

// Load seller's single address
const loadSellerAddress = async () => {
  if (!entityId || isEditing) return; 

  
  setLoadingAddress(true);
  try {
    const response = await fetch(`https://localhost:7062/api/SellerAddresses/Seller/${entityId}`);
    if (response.ok) {
      const data = await response.json();
      console.log('📍 Loaded seller address:', data);
      
      if (data && data.address) {
  setCurrentAddress({
    id: data.address.id,
    sellerAddressId: data.id,
    street: data.address.street || '',
    city: data.address.city || '',
    region: data.address.region || '',
    postalCode: data.address.postalCode || '',
    country: data.address.country || 'Bahrain',
    latitude: data.address.latitude || null,
    longitude: data.address.longitude || null
  });
  
  // Only update form data if NOT editing
  if (!isEditing) {
    setFormData(prev => ({
      ...prev,
      street: data.address.street || '',
      city: data.address.city || '',
      region: data.address.region || '',
      postalCode: data.address.postalCode || '',
      country: data.address.country || 'Bahrain'
    }));
  }
  
  // Set saved location for map
  if (data.address.latitude && data.address.longitude) {
    setSavedLocation({
      lat: parseFloat(data.address.latitude),
      lng: parseFloat(data.address.longitude)
    });
  }
}
    } else if (response.status === 404) {
      // No address exists yet
      setCurrentAddress(null);
    }
  } catch (error) {
    console.error('Error loading seller address:', error);
  } finally {
    setLoadingAddress(false);
  }
};

// Map selector component with auto-fill
const MapSelector = () => {
  useMapEvents({
    click: async (e) => {
  const { lat, lng } = e.latlng;
  setMapLocation(e.latlng);
  setSavedLocation(e.latlng);

  // Auto-fill address fields from coordinates
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    const addr = data.address || {};

    // Build new values, preserving manual edits
    const newFormData = {};
    
    if (addr.road || addr.street || addr.pedestrian) {
      newFormData.street = addr.road || addr.street || addr.pedestrian;
    }
    if (addr.city || addr.town || addr.village || addr.municipality) {
      newFormData.city = addr.city || addr.town || addr.village || addr.municipality;
    }
    if (addr.country) {
      newFormData.country = addr.country;
    }
    if (addr.state || addr.county || addr.region) {
      newFormData.region = addr.state || addr.county || addr.region;
    }
    if (addr.postcode) {
      newFormData.postalCode = addr.postcode;
    }

    // Only update if we got at least some data
    if (Object.keys(newFormData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...newFormData
      }));
    } else {
      showSnackbar('Location saved, but could not auto-fill address', 'warning');
    }
  } catch (err) {
    console.error('Error fetching address:', err);
    showSnackbar('Location saved, but could not auto-fill address', 'warning');
  }
}
  });
  return null;
};

// Handle map save
// Handle map save - REMOVED, we'll auto-fill on click instead

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

    // Handle address for sellers
if (userRole === 'Seller' && entityId) {
  // Validate address fields
  if (!formData.street || !formData.city || !formData.country) {
    setSaveMessage({ type: 'error', text: 'Please fill in all required address fields' });
    setIsSaving(false);
    return;
  }

  // Require coordinates
  if (!savedLocation || !savedLocation.lat || !savedLocation.lng) {
    setSaveMessage({ type: 'error', text: 'Please pick a location on the map' });
    setIsSaving(false);
    return;
  }

  const addressData = {
    Street: formData.street,
    City: formData.city,
    Region: formData.region || null,
    PostalCode: formData.postalCode || null,
    Country: formData.country,
    Latitude: savedLocation.lat,
    Longitude: savedLocation.lng
  };

  if (currentAddress && currentAddress.id) {
    // Update existing address
    const addressResponse = await fetch(`https://localhost:7062/api/Addresses/${currentAddress.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData)
    });

    if (!addressResponse.ok) {
      throw new Error('Failed to update address');
    }
  } else {
    // Create new address
    const addressResponse = await fetch(`https://localhost:7062/api/Addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addressData,
        Label: null,
        IsDefault: false
      })
    });

    if (!addressResponse.ok) {
      throw new Error('Failed to create address');
    }

    const newAddress = await addressResponse.json();

    // Link to seller
    const linkResponse = await fetch(`https://localhost:7062/api/SellerAddresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        SellerId: entityId,
        AddressId: newAddress.id
      })
    });

    if (!linkResponse.ok) {
      throw new Error('Failed to link address to seller');
    }
  }

  // Reload address
  await loadSellerAddress();
}

        // Handle address for customers
    if (userRole === 'Customer' && entityId && addressWasModified) {
      // Only save when address was modified
      // Validate address fields
      if (!formData.street || !formData.city || !formData.country) {
        setSaveMessage({ type: 'error', text: 'Please fill in all required address fields' });
        setIsSaving(false);
        return;
      }

      // Require coordinates
      if (!savedLocation || !savedLocation.lat || !savedLocation.lng) {
        setSaveMessage({ type: 'error', text: 'Please pick a location on the map' });
        setIsSaving(false);
        return;
      }

      const addressData = {
        Street: formData.street,
        City: formData.city,
        Region: formData.region || null,
        PostalCode: formData.postalCode || null,
        Country: formData.country,
        Latitude: savedLocation.lat,
        Longitude: savedLocation.lng
      };

      if (currentAddress && currentAddress.id) {
        // Update existing customer address
        const addressResponse = await fetch(`https://localhost:7062/api/Addresses/${currentAddress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressData)
        });

        if (!addressResponse.ok) {
          throw new Error('Failed to update address');
        }
      } else {
        // Create new customer address
        const addressResponse = await fetch(`https://localhost:7062/api/Addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...addressData,
            Label: null,
            IsDefault: false
          })
        });

        if (!addressResponse.ok) {
          throw new Error('Failed to create address');
        }

        const newAddress = await addressResponse.json();

        // Link to customer
        const linkResponse = await fetch(`https://localhost:7062/api/CustomerAddresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            CustomerId: entityId,
            AddressId: newAddress.id
          })
        });

        if (!linkResponse.ok) {
          throw new Error('Failed to link address to customer');
        }
      }
      
      // Clear form after save
      setFormData(prev => ({
        ...prev,
        street: '',
        city: '',
        region: '',
        postalCode: '',
        country: 'Bahrain'
      }));
      setSavedLocation(null);
      setMapLocation(null);
      setCurrentAddress(null);
      setAddressWasModified(false); // ← RESET FLAG
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

    // Update store description for sellers
    if (userRole === 'Seller' && entityId) {
      try {
        const descResponse = await fetch(`https://localhost:7062/api/Sellers/${entityId}/store-description`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: formData.storeDescription })
        });

        if (!descResponse.ok) {
          const errorData = await descResponse.json();
          throw new Error(errorData.message || 'Failed to update description');
        }
      } catch (error) {
        console.error('Error updating description:', error);
        throw error;
      }
    }

    setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    setIsEditing(false);

    // Call parent update handler
    if (onProfileUpdate) {
      await onProfileUpdate({ forceRefresh: true });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile. Please try again.' });
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
        country: userProfile.country || 'Bahrain',
        storeDescription: userProfile.storeDescription || ''
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
    showSnackbar('Please select an image file (PNG or JPG)', 'error');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showSnackbar('Image size must be less than 5MB', 'error');
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setImagePreview(reader.result);
    setShowCropper(true);
  };
  reader.readAsDataURL(file);
};

const handleSaveImage = async () => {
  if (!imagePreview || !entityId) {
    showSnackbar('No image to save', 'error');
    return;
  }

  setUploadingImage(true);

  try {
    let finalImage = imagePreview;
    
    // If cropper was used, get the cropped image
    if (showCropper && croppedAreaPixels) {
      finalImage = await createCroppedImage();
      if (!finalImage) {
        showSnackbar('Failed to crop image', 'error');
        setUploadingImage(false);
        return;
      }
    }

    const response = await fetch(`https://localhost:7062/api/Sellers/${entityId}/store-image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: finalImage })
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    
    // Update local preview with the returned URL
    setImagePreview(result.storeImageUrl);
    
    setSaveMessage({ type: 'success', text: 'Store logo updated successfully!' });
    setShowImageModal(false);
    setShowCropper(false);

    // Trigger parent refresh with the new image URL
    if (onProfileUpdate) {
      await onProfileUpdate({ 
        forceRefresh: true,
        storeImageUrl: result.storeImageUrl 
      });
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

// Customer address handlers
const handleEditCustomerAddress = (address) => {
  setFormData(prev => ({
    ...prev,
    street: address.street || '',
    city: address.city || '',
    region: address.region || '',
    postalCode: address.postalCode || '',
    country: address.country || 'Bahrain'
  }));
  
  if (address.latitude && address.longitude) {
    setSavedLocation({
      lat: parseFloat(address.latitude),
      lng: parseFloat(address.longitude)
    });
    setMapLocation({
      lat: parseFloat(address.latitude),
      lng: parseFloat(address.longitude)
    });
  }
  
  setCurrentAddress(address);
  setShowMapModal(true);
};

const handleDeleteCustomerAddress = async (addressId) => {
  setConfirmModal({
    isOpen: true,
    title: 'Delete Address',
    message: 'Are you sure you want to delete this address? This action cannot be undone.',
    variant: 'danger',
    onConfirm: async () => {
      try {
        const response = await fetch(`https://localhost:7062/api/Addresses/${addressId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete address');
        }

        showSnackbar('Address deleted successfully!', 'success');
        
        // Close modal
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'danger' });
        
        // Trigger parent refresh
        if (onProfileUpdate) {
          await onProfileUpdate({ forceRefresh: true });
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        showSnackbar('Failed to delete address. Please try again.', 'error');
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'danger' });
      }
    }
  });
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
                      src={imagePreview}
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
                <h1 className="text-display-h2 text-charcoal-600 dark:text-white font-semibold mb-2">
                  {formData.displayName || 'User Profile'}
                </h1>
                <p className="text-body-large text-charcoal-400 dark:text-gray-400">{userRole}</p>
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
          {/* Store Description - Only for Sellers */}
            `{userRole === 'Seller' && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-sage-900 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-sage-700 dark:text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Store Description</p>
                  {isEditing ? (
                    <>
                      <textarea
                        name="storeDescription"
                        value={formData.storeDescription}
                        onChange={handleInputChange}
                        rows={4}
                        maxLength={500}
                        className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
                        placeholder="Describe your store in a few words..."
                      />
                      <p className="text-xs text-charcoal-400 dark:text-gray-400 mt-1">
                        {formData.storeDescription?.length || 0}/500 characters
                      </p>
                    </>
                  ) : (
                    <p className="text-body-regular text-charcoal-600 dark:text-white font-medium whitespace-pre-wrap">
                      {formData.storeDescription || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Address Management Card - For Sellers and Customers */}
{showContactFields && (
  <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none p-6 transition-colors">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold">
          {userRole === 'Seller' ? 'Store Address' : 'My Addresses'}
        </h2>
        <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mt-1">
          {userRole === 'Seller' 
            ? 'Your store pickup/delivery location' 
            : 'Manage your saved delivery addresses'}
        </p>
      </div>
      {isEditing && (userRole !== 'Seller' || !currentAddress) && (
        <button
          onClick={() => setShowMapModal(true)}
          className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors"
        >
          <MapPin size={18} weight="bold" />
          Add Address
        </button>
      )}
    </div>

    {/* Loading State */}
    {loadingAddress ? (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-sage-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-charcoal-400">Loading addresses...</span>
      </div>
    ) : (
      <>
        {/* Seller - Single Address Display */}
        {userRole === 'Seller' && (
          <>
            {currentAddress ? (
              <div className={`relative p-4 rounded-xl border-2 transition-all ${
                isEditing 
                  ? 'border-grey-stroke bg-cream-50' 
                  : 'border-grey-stroke bg-cream-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-body-medium font-semibold text-charcoal-600 mb-1">
                      {currentAddress.street}
                    </p>
                    <p className="text-label-medium text-charcoal-400">
                      {[currentAddress.city, currentAddress.region, currentAddress.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {currentAddress.latitude && currentAddress.longitude && (
                      <p className="text-xs text-charcoal-400 mt-1 flex items-center gap-1">
                        <MapPin size={12} weight="fill" />
                        {currentAddress.latitude.toFixed(4)}, {currentAddress.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      onClick={() => setShowMapModal(true)}
                      className="p-2 rounded-lg transition-all bg-grey-100 hover:bg-grey-200 text-charcoal-600"
                      title="Edit Address"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-grey-100 dark:bg-charcoal-600 rounded-xl border-2 border-dashed border-grey-stroke dark:border-charcoal-500">
                <MapPin size={48} className="mx-auto text-grey-stroke mb-3" />
                <p className="text-body-regular text-charcoal-400 dark:text-charcoal-300 mb-4">
                  No store address yet
                </p>
                {isEditing && (
                  <button
                    onClick={() => setShowMapModal(true)}
                    className="bg-sage-500 text-white px-5 py-2.5 rounded-xl text-button font-semibold hover:bg-sage-600 shadow-soft-lift"
                  >
                    + Add Store Address
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Customer - Multiple Addresses Display (Like Checkout) */}
        {/* Customer - Multiple Addresses Display (Like Checkout) */}
          {userRole === 'Customer' && (
            <>
              {customerAddresses && Array.isArray(customerAddresses) && customerAddresses.length > 0 ? (
                <div className="space-y-3">
                  {customerAddresses
                    .filter(ca => ca && ca.address && ca.address.isActive !== false)
                    .map(ca => {
                      const addr = ca.address || {};
                      
                      return (
                        <div
                          key={ca.id || addr.id}
                          className="relative p-4 rounded-xl border-2 transition-all bg-cream-50 border-grey-stroke"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-20">
                              <p className="text-body-medium font-semibold text-charcoal-600 mb-1">
                                {addr.street || 'No street'}
                              </p>
                              <p className="text-label-medium text-charcoal-400">
                                {[addr.city, addr.region, addr.country]
                                  .filter(Boolean)
                                  .join(', ') || 'No location'}
                              </p>
                              {addr.latitude && addr.longitude && (
                                <p className="text-xs text-charcoal-400 mt-1 flex items-center gap-1">
                                  <MapPin size={12} weight="fill" />
                                  {parseFloat(addr.latitude).toFixed(4)}, {parseFloat(addr.longitude).toFixed(4)}
                                </p>
                              )}
                            </div>

                            {isEditing && (
                              <div className="absolute top-3 right-3 flex gap-2">
                                <button
                                  onClick={() => handleEditCustomerAddress(addr)}
                                  className="p-2 rounded-lg transition-all bg-grey-100 hover:bg-grey-200 text-charcoal-600"
                                  title="Edit Address"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomerAddress(addr.id)}
                                  className="p-2 rounded-lg transition-all bg-grey-100 hover:bg-red-500 hover:text-white text-charcoal-600"
                                  title="Delete Address"
                                >
                                  <Trash size={16} weight="bold" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12 bg-grey-100 dark:bg-charcoal-600 rounded-xl border-2 border-dashed border-grey-stroke dark:border-charcoal-500">
                  <MapPin size={48} className="mx-auto text-grey-stroke mb-3" />
                  <p className="text-body-regular text-charcoal-400 dark:text-charcoal-300 mb-4">
                    No addresses saved yet
                  </p>
                  {isEditing && (
                    <button
                      onClick={() => setShowMapModal(true)}
                      className="bg-sage-500 text-white px-5 py-2.5 rounded-xl text-button font-semibold hover:bg-sage-600 shadow-soft-lift"
                    >
                      + Add Your First Address
                    </button>
                  )}
                </div>
              )}
            </>
          )}
      </>
    )}
  </div>
)}
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
                    onClick={() => {
                      setShowImageModal(false);
                      setShowCropper(false);
                      setImagePreview(null);
                    }}
                    className="p-2 hover:bg-grey-100 dark:hover:bg-charcoal-600 rounded-full transition-colors"
                  >
                    <X size={20} weight="bold" className="text-charcoal-600 dark:text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Image Preview/Cropper */}
                <div className="mb-6">
                  <div className="w-full aspect-square rounded-xl border-2 border-dashed border-grey-stroke dark:border-charcoal-500 flex items-center justify-center overflow-hidden bg-grey-100 dark:bg-charcoal-600 relative">
                    {imagePreview && showCropper ? (
                      <>
                        <Cropper
                          image={imagePreview}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                        {/* Zoom Controls */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-charcoal-700 rounded-full px-6 py-3 shadow-lg z-10 flex items-center gap-3">
                          <span className="text-sm font-semibold text-charcoal-600 dark:text-white">Zoom:</span>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-32"
                          />
                        </div>
                      </>
                    ) : imagePreview && !showCropper ? (
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
                    disabled={!imagePreview || uploadingImage || (showCropper && !croppedAreaPixels)}
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


{/* MAP MODAL - For Sellers and Customers */}
{showMapModal && (
  <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
    <div className="bg-white dark:bg-[#2A2A2A] rounded-3xl w-full max-w-2xl overflow-hidden">
      <div className="p-5 border-b border-grey-stroke dark:border-charcoal-500 flex justify-between items-center">
        <h3 className="text-xl font-bold text-charcoal-600 dark:text-white">Pick Location on Map</h3>
        <button
          onClick={() => setShowMapModal(false)}
          className="p-2 hover:bg-grey-100 dark:hover:bg-charcoal-600 rounded-full"
        >
          <X size={20} weight="bold" />
        </button>
      </div>
      <div className="h-80">
        <MapContainer
          center={[26.0667, 50.5577]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapSelector />
          {mapLocation && <Marker position={[mapLocation.lat, mapLocation.lng]} />}
        </MapContainer>
      </div>
      <div className="p-5 space-y-4">
  {mapLocation && (
    <p className="text-sm text-charcoal-600 dark:text-white text-center">
      📍 Location: {mapLocation.lat.toFixed(4)}, {mapLocation.lng.toFixed(4)}
    </p>
  )}


  {/* Address Form Fields */}
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-charcoal-600 dark:text-white mb-1">
        Street <span className="text-error-text">*</span>
      </label>
      <input
        type="text"
        name="street"
        value={formData.street}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
        placeholder="Enter street address"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-charcoal-600 dark:text-white mb-1">
          City <span className="text-error-text">*</span>
        </label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          placeholder="Enter city"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-600 dark:text-white mb-1">
          Country <span className="text-error-text">*</span>
        </label>
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

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-charcoal-600 dark:text-white mb-1">
          Region (Optional)
        </label>
        <input
          type="text"
          name="region"
          value={formData.region}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          placeholder="Region"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-600 dark:text-white mb-1">
          Postal Code (Optional)
        </label>
        <input
          type="text"
          name="postalCode"
          value={formData.postalCode}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-charcoal-400 dark:border-charcoal-500 dark:bg-charcoal-600 rounded-md text-body-regular text-charcoal-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          placeholder="Postal code"
        />
      </div>
    </div>
  </div>
  
  <div className="flex gap-3 pt-2">
    <button
        onClick={() => {
        if (!mapLocation || !formData.street || !formData.city || !formData.country) {
          showSnackbar('Please pick a location on the map and ensure all fields are filled', 'error');
          return;
        }
        
        setAddressWasModified(true); // ← ADD THIS LINE
        setShowMapModal(false);
        showSnackbar('Address ready! Click "Save Changes" to apply.', 'success');
      }}
  disabled={!mapLocation || !formData.street || !formData.city || !formData.country}
  className="flex-1 bg-sage-500 text-white font-bold py-2.5 rounded-xl hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed"
>
  Confirm Address
</button>
    <button
      onClick={() => {
        setShowMapModal(false);
        setMapLocation(null);
      }}
      className="flex-1 bg-grey-300 dark:bg-charcoal-600 text-charcoal-600 dark:text-white font-bold py-2.5 rounded-xl hover:bg-grey-400 dark:hover:bg-charcoal-500"
    >
      Cancel
    </button>
  </div>
</div>
    </div>
  </div>
)}

{/* Snackbar */}
<Snackbar 
  open={snackbar.open}
  message={snackbar.message}
  type={snackbar.type}
  onClose={() => setSnackbar({ open: false, message: '', type: 'success' })}
/>

{/* Confirm Modal */}
<ConfirmModal
  isOpen={confirmModal.isOpen}
  onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'danger' })}
  onConfirm={confirmModal.onConfirm}
  title={confirmModal.title}
  message={confirmModal.message}
  confirmText="Delete"
  variant={confirmModal.variant}
/>
    </div>
  );
}