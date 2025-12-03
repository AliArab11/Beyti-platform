import { useState, useEffect } from 'react';
import ProviderOverview from './components/ProviderOverview';
import ServicesManagement from './components/ServicesManagement';
import ScheduleManagement from './components/ScheduleManagement';
import BookingsManagement from './components/BookingsManagement';
import ReviewsManagement from './components/ReviewsManagement';
import NotificationsPage from './components/NotificationsPage';
import ProfilePage from '../../components/ProfilePage';
import ServiceProviderSidebar from './components/ServiceProviderSidebar';
import PageHeader from '../../components/PageHeader';
import { getUserProfile, updateUserProfile, updateProviderStatus } from '../../services/api';

export default function ServiceProviderDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState(null);
  const [displayName, setDisplayName] = useState("Service Provider");
  const [userProfile, setUserProfile] = useState(null);
  const [providerStatus, setProviderStatus] = useState('Available');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');

  // Hardcoded login credentials - TODO: Replace with actual authentication/context
  const userProfileId = 1031; // Logged-in service provider's UserProfile ID
  const serviceProviderId = 6; // Logged-in service provider's ID in ServiceProvider table

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
          status: profile.Status, // This is ServiceProvider.Status from the API
          phone: profile.Phone,
          businessName: profile.BusinessName,
          street: profile.Street,
          city: profile.City,
          region: profile.Region,
          postalCode: profile.PostalCode,
          country: profile.Country,
          address: profile.Address,
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };

        console.log('[fetchUserProfile] Normalized profile status:', normalizedProfile.status);
        setUserProfile(normalizedProfile);
        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }
        // Set provider status from profile - this comes from ServiceProvider.Status
        // The UserProfilesController returns ServiceProvider.Status for service providers
        if (normalizedProfile.status) {
          console.log('[fetchUserProfile] Setting providerStatus to:', normalizedProfile.status);
          setProviderStatus(normalizedProfile.status);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(userProfileId, 'ServiceProvider', updates);
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

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    const previousStatus = providerStatus;
    console.log(`[handleStatusChange] Changing status from '${previousStatus}' to '${newStatus}'`);
    setIsUpdatingStatus(true);
    try {
      setProviderStatus(newStatus); // Optimistic update
      const response = await updateProviderStatus(serviceProviderId, newStatus);
      console.log('[handleStatusChange] Update response:', response);
    } catch (error) {
      console.error('Error updating provider status:', error);
      // Revert on error
      setProviderStatus(previousStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handler for navigating from dashboard stats to bookings with filter
  const handleNavigateToBookings = (status) => {
    setBookingFilter(status);
    setActiveTab('bookings');
  };

  // Reset filter when manually switching to bookings tab
  const handleNavigate = (tabId) => {
    if (tabId === 'bookings' && activeTab !== 'bookings') {
      setBookingFilter(null); // Reset filter when manually clicking bookings tab
    }
    setActiveTab(tabId);
  };

  // Get page title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard';
      case 'services':
        return 'My Services';
      case 'bookings':
        return 'Booking Requests';
      case 'schedule':
        return 'Availability';
      case 'reviews':
        return 'Reviews';
      case 'notifications':
        return 'Notifications';
      case 'profile':
        return 'My Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-charcoal-600">
      {/* Sidebar */}
      <ServiceProviderSidebar
        currentPage={activeTab}
        onNavigate={handleNavigate}
        userName={displayName}
        userRole="Provider"
      />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header */}
        <PageHeader
          title={getPageTitle()}
          withSearch={activeTab === 'reviews' || activeTab === 'notifications'}
          searchPlaceholder={
            activeTab === 'notifications'
              ? 'Search notifications by title, content, or type...'
              : 'Search by customer, service, or comment...'
          }
          onSearch={setReviewSearchQuery}
          notificationCount={0}
          userName={displayName}
          userRole="Service Provider"
          userProfile={userProfile}
          entityId={serviceProviderId}
          userId={userProfileId}
          onProfileClick={() => setActiveTab('profile')}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-charcoal-600 dark:text-white">
                      Welcome back, {displayName}!
                    </h2>
                  </div>

                  {/* Status Selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                      Your Status:
                    </label>
                    <select
                      value={providerStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={isUpdatingStatus}
                      className={`px-4 py-2 border border-grey-stroke dark:border-charcoal-500 bg-grey-200 dark:bg-charcoal-600 rounded-md text-body-regular font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 transition-colors ${
                        providerStatus === 'Available'
                          ? 'text-success-text'
                          : providerStatus === 'Busy'
                          ? 'text-warning-text'
                          : 'text-error-text'
                      } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
                <ProviderOverview
                  serviceProviderId={serviceProviderId}
                  onNavigateToBookings={handleNavigateToBookings}
                />
              </>
            )}
            {activeTab === 'services' && (
              <ServicesManagement serviceProviderId={serviceProviderId} />
            )}
            {activeTab === 'schedule' && (
              <ScheduleManagement serviceProviderId={serviceProviderId} />
            )}
            {activeTab === 'bookings' && (
              <BookingsManagement
                serviceProviderId={serviceProviderId}
                initialFilter={bookingFilter}
              />
            )}
            {activeTab === 'reviews' && (
              <ReviewsManagement
                serviceProviderId={serviceProviderId}
                searchQuery={reviewSearchQuery}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsPage userId={userProfileId} />
            )}
            {activeTab === 'profile' && (
              <ProfilePage
                userProfile={userProfile}
                userRole="ServiceProvider"
                entityId={serviceProviderId}
                onProfileUpdate={handleProfileUpdate}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}