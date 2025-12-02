import { useState, useEffect } from 'react';
import ProviderOverview from './components/ProviderOverview';
import ServicesManagement from './components/ServicesManagement';
import ScheduleManagement from './components/ScheduleManagement';
import BookingsManagement from './components/BookingsManagement';
import ProfilePage from './components/ProfilePage';
import ServiceProviderSidebar from './components/ServiceProviderSidebar';
import PageHeader from '../../components/PageHeader';
import { getProviderProfile } from '../../services/api';

export default function ServiceProviderDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState(null);
  const [displayName, setDisplayName] = useState("Service Provider");
  const [userProfile, setUserProfile] = useState(null);

  // TODO: Get this from authentication/context
  const userProfileId = 1031; // Replace with actual logged-in user
  const serviceProviderId = 6; // Replace with actual provider ID

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      const profile = await getProviderProfile(userProfileId);
      if (profile) {
        setUserProfile(profile);
        if (profile.displayName) {
          setDisplayName(profile.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userProfileId]);

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
    <div className="flex min-h-screen bg-cream-50">
      {/* Sidebar */}
      <ServiceProviderSidebar
        currentPage={activeTab}
        onNavigate={handleNavigate}
        userName="Service Provider"
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
          onProfileClick={() => setActiveTab('profile')}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Welcome back, {displayName}!
                  </h2>
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
                serviceProviderId={serviceProviderId}
                onProfileUpdate={fetchUserProfile}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}