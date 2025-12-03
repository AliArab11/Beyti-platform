import { useState, useEffect } from 'react';
import ProviderOverview from './components/ProviderOverview';
import ServicesManagement from './components/ServicesManagement';
import ScheduleManagement from './components/ScheduleManagement';
import BookingsManagement from './components/BookingsManagement';
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

  
// 1. Get the logged-in user's Profile ID from the browser storage
const userProfileId = localStorage.getItem('userId'); 

// 2. Create state to hold the Provider ID (we will get this from the API)
const [serviceProviderId, setServiceProviderId] = useState(null);

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      // 1. Check if we have a valid User ID to query
      if (!userProfileId) {
        console.warn('[fetchUserProfile] No userProfileId available, skipping fetch.');
        return;
      }

      // 2. CRITICAL CHANGE: Use getProviderProfile instead of getUserProfile
      // This hits the new endpoint: GET /api/ServiceProviderDashboard/Profile/{id}
      const profile = await getProviderProfile(userProfileId);
      
      console.log('[fetchUserProfile] Received provider profile:', profile);

      if (profile) {
        // 3. Map the Backend (PascalCase) data to Frontend (camelCase)
        const normalizedProfile = {
          id: profile.Id, // CRITICAL: This is the actual ServiceProviderId (e.g., 6)
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          status: profile.Status, 
          phone: profile.Phone,
          businessName: profile.BusinessName,
          // Address fields from the new controller
          street: profile.Street,
          city: profile.City,
          region: profile.Region,
          postalCode: profile.PostalCode,
          country: profile.Country,
          address: profile.Address, // Formatted string
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };

        console.log('[fetchUserProfile] Normalized profile:', normalizedProfile);
        
        // 4. Update all necessary states
        setUserProfile(normalizedProfile);
        
        // CRITICAL: Save the ServiceProviderId to state so other widgets can use it
        // (Make sure you have [serviceProviderId, setServiceProviderId] = useState(null) defined above)
        setServiceProviderId(normalizedProfile.id); 

        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }

        // Set provider status (Available/Busy/Unavailable)
        if (normalizedProfile.status) {
          setProviderStatus(normalizedProfile.status);
        }
      }
    } catch (error) {
      console.error('Error fetching service provider profile:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      // Use the provider-specific update function
      // This hits: PUT /api/ServiceProviderDashboard/UpdateProfile/{id}
      await updateProviderProfile(userProfileId, updates);
      
      // Refresh the profile after update
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userProfileId) {
        fetchUserProfile();
    }
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
          notificationCount={0}
          userName={displayName}
          userRole="Service Provider"
          userProfile={userProfile}
          entityId={serviceProviderId}
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