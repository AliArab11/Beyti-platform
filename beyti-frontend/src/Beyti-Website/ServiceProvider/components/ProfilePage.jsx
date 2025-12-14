import { useState, useEffect } from 'react';
import { User, Envelope, Phone, MapPin, Calendar, IdentificationCard, CheckCircle, XCircle } from '@phosphor-icons/react';
import { updateProviderProfile, updateProviderStatus, updateProviderAddress } from '../../../services/api';

export default function ProfilePage({ userProfile, serviceProviderId, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    status: 'Available',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Bahrain'
  });

  // Initialize form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        status: userProfile.status || 'Available',
        street: userProfile.street || '',
        city: userProfile.city || '',
        region: userProfile.region || '',
        postalCode: userProfile.postalCode || '',
        country: userProfile.country || 'Bahrain'
      });
    }
  }, [userProfile]);

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
      // Update profile data
      await updateProviderProfile(userProfile.userProfileId || userProfile.id, {
        DisplayName: formData.displayName,
        Phone: formData.phone
      });

      // Update service provider status separately if changed
      if (formData.status !== userProfile.status && serviceProviderId) {
        await updateProviderStatus(serviceProviderId, formData.status);
      }

      // Update address if any address field has changed
      const hasAddressChanged =
        formData.street !== (userProfile.street || '') ||
        formData.city !== (userProfile.city || '') ||
        formData.region !== (userProfile.region || '') ||
        formData.postalCode !== (userProfile.postalCode || '') ||
        formData.country !== (userProfile.country || 'Kuwait');

      if (hasAddressChanged && serviceProviderId) {
        await updateProviderAddress(serviceProviderId, {
          Street: formData.street,
          City: formData.city,
          Region: formData.region,
          PostalCode: formData.postalCode,
          Country: formData.country
        });
      }

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);

      // Notify parent to refresh profile data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        status: userProfile.status || 'Available',
        street: userProfile.street || '',
        city: userProfile.city || '',
        region: userProfile.region || '',
        postalCode: userProfile.postalCode || '',
        country: userProfile.country || 'Kuwait'
      });
    }
    setIsEditing(false);
    setSaveMessage(null);
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-body-regular text-charcoal-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-success-bg text-success-text';
      case 'Busy':
        return 'bg-warning-bg text-warning-text';
      case 'Unavailable':
        return 'bg-error-bg text-error-text';
      default:
        return 'bg-grey-300 text-charcoal-600';
    }
  };

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
                <p className="text-body-large text-charcoal-400 dark:text-gray-400 mt-1">Service Provider</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-medium font-medium ${getStatusBadgeColor(formData.status)}`}>
                    {formData.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-2.5 border border-grey-stroke dark:border-charcoal-500 text-charcoal-600 dark:text-white rounded-md hover:bg-grey-200 dark:hover:bg-[#2A2A2A] transition-colors text-body-regular font-medium disabled:opacity-50"
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
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={20} className="text-sage-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Display Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
                    placeholder="Enter your display name"
                  />
                ) : (
                  <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                    {formData.displayName || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Phone size={20} className="text-sage-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                    {formData.phone || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Contact & Address Card */}
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg border border-grey-stroke dark:border-charcoal-500 shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <h2 className="text-display-h3 text-charcoal-600 dark:text-white font-semibold mb-6">Contact & Status</h2>

          <div className="space-y-4">
            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin size={20} className="text-sage-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Address</p>
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Street */}
                    <div>
                      <label className="text-label-small text-charcoal-500 mb-1 block">Street</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        placeholder="Enter street address"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="text-label-small text-charcoal-500 mb-1 block">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        placeholder="Enter city"
                      />
                    </div>

                    {/* Region */}
                    <div>
                      <label className="text-label-small text-charcoal-500 mb-1 block">Region</label>
                      <input
                        type="text"
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        placeholder="Enter region/state"
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="text-label-small text-charcoal-500 mb-1 block">Postal Code (Optional)</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        placeholder="Enter postal code"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="text-label-small text-charcoal-500 mb-1 block">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
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

            {/* Service Provider Status */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center flex-shrink-0 mt-1">
                <IdentificationCard size={20} className="text-sage-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-1">Service Provider Status</p>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-charcoal-400 rounded-md text-body-regular text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-medium font-medium ${getStatusBadgeColor(formData.status)}`}>
                    {formData.status}
                  </span>
                )}
              </div>
            </div>

            {/* User Profile ID */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center flex-shrink-0 mt-1">
                <IdentificationCard size={20} className="text-sage-700" />
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

          {/* Account Status - Service Providers show accountStatus (Active/Inactive), not service availability status */}
          <div className="flex flex-col">
            <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mb-2">Account Status</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-medium font-medium w-fit ${
              userProfile.accountStatus === 'Inactive' || userProfile.accountStatus === 'Suspended'
                ? 'bg-error-bg text-error-text'
                : 'bg-success-bg text-success-text'
            }`}>
              {userProfile.accountStatus || 'Active'}
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
