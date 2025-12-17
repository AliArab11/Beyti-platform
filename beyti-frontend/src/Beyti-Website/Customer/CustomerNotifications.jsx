/**
 * Customer Notifications Page
 *
 * Displays customer notifications with sidebar navigation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar from '../../components/CustomerSidebar';
import PageHeader from '../../components/PageHeader';
import NotificationsPage from '../ServiceProvider/components/NotificationsPage';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { isAuthenticated, getUserId, handleSuspensionError } from '../../utils/authUtils';

export default function CustomerNotifications() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Customer");
  const [userProfile, setUserProfile] = useState(null);
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('');

  // Check authentication on mount
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     navigate('/login');
  //   }
  // }, [navigate]);

  // Get user ID from localStorage
  const userProfileId = parseInt(getUserId()) || 1002;
  const customerId = 2; // TODO: Get from API based on userProfileId

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile(userProfileId);
      console.log('[fetchUserProfile] Received profile:', profile);
      if (profile) {
        // API returns PascalCase, convert to camelCase for frontend use
        const normalizedProfile = {
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          accountStatus: profile.AccountStatus,
          phone: profile.Phone,
          street: profile.Street,
          city: profile.City,
          region: profile.Region,
          postalCode: profile.PostalCode,
          country: profile.Country,
          address: profile.Address,
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };

        console.log('[fetchUserProfile] Normalized profile:', normalizedProfile);
        console.log('[fetchUserProfile] Account status:', normalizedProfile.accountStatus);

        // Check if account is suspended
        if (normalizedProfile.accountStatus === 'Suspended') {
          navigate('/account-suspended');
          return;
        }

        setUserProfile(normalizedProfile);
        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Check if error is due to suspension
      if (!handleSuspensionError(error, navigate)) {
        // Handle other errors
        console.error('Failed to load profile');
      }
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(userProfileId, 'Customer', updates);
      // Refresh the profile after update
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userProfileId]);

  // Handle sidebar navigation
  const handleNavigate = (view) => {
    switch(view) {
      case 'stores':
        navigate('/mainStore');
        break;
      case 'services':
        navigate('/serviceProviders');
        break;
      case 'notifications':
        // Stay on current page
        break;
      case 'history':
        navigate('/customer/history');
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-charcoal-600">
      {/* Sidebar */}
      <CustomerSidebar
        currentPage="notifications"
        onNavigate={handleNavigate}
        userName={displayName}
        userRole="Customer"
      />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header */}
        <PageHeader
          title="Notifications"
          withSearch={true}
          searchPlaceholder="Search notifications by title, content, or type..."
          onSearch={setNotificationSearchQuery}
          notificationCount={0}
          userName={displayName}
          userRole="Customer"
          userProfile={userProfile}
          entityId={customerId}
          userId={userProfileId}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <NotificationsPage
              userId={userProfileId}
              searchQuery={notificationSearchQuery}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
