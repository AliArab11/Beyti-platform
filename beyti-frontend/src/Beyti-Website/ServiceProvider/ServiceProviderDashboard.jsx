import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderOverview from './components/ProviderOverview';
import ServicesManagement from './components/ServicesManagement';
import ScheduleManagement from './components/ScheduleManagement';
import BookingsManagement from './components/BookingsManagement';
import ReviewsManagement from './components/ReviewsManagement';
import NotificationsPage from './components/NotificationsPage';
import ProfilePage from '../../components/ProfilePage';
import ServiceProviderSidebar from './components/ServiceProviderSidebar';
import PageHeader from '../../components/PageHeader';
import Snackbar from '../../components/Snackbar';
import ConfirmModal from '../../components/ConfirmModal';
import { getUserProfile, updateUserProfile, updateProviderStatus, getProviderProfile } from '../../services/api';
import { logProviderActivity } from '../../utils/providerActivityLogger';
import { isAuthenticated, getUserId, handleSuspensionError } from '../../utils/authUtils';

export default function ServiceProviderDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState(null);
  const [bookingViewMode, setBookingViewMode] = useState(null);
  const [displayName, setDisplayName] = useState("Service Provider");
  const [userProfile, setUserProfile] = useState(null);
  const [providerStatus, setProviderStatus] = useState('Available');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [serviceProviderId, setServiceProviderId] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

  // ConfirmModal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  // Check authentication on mount
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     navigate('/login');
  //   }
  // }, [navigate]);

  // Get user ID from localStorage (will be replaced with context in future)
  const userProfileId = parseInt(localStorage.getItem('userProfileId')) || null;

  // Auto-close snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

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

      // Check if profile is null or undefined
      if (!profile) {
        console.error('[fetchUserProfile] Profile not found for userProfileId:', userProfileId);
        setSnackbar({
          open: true,
          message: 'Profile not found. Please complete your registration.',
          type: 'error'
        });
        // Redirect to provider onboarding to complete registration
        setTimeout(() => {
          navigate('/provider-onboarding');
        }, 2000);
        return;
      }

      console.log('[fetchUserProfile] Profile keys:', Object.keys(profile));

      // 3. Map the Backend data to Frontend (check if PascalCase or camelCase)
      const normalizedProfile = {
        id: profile.id || profile.Id,
        userProfileId: profile.userProfileId || profile.UserProfileId,
        displayName: profile.displayName || profile.DisplayName,
        roleType: profile.roleType || profile.RoleType,
        status: profile.status || profile.Status, // This is ServiceProvider.Status from the API
        accountStatus: profile.accountStatus || profile.AccountStatus, // UserProfile.Status (Active/Suspended)
        phone: profile.phone || profile.Phone,
        businessName: profile.businessName || profile.BusinessName,
        // Address fields from the new controller
        street: profile.street || profile.Street,
        city: profile.city || profile.City,
        region: profile.region || profile.Region,
        postalCode: profile.postalCode || profile.PostalCode,
        country: profile.country || profile.Country,
        address: profile.address || profile.Address, // Formatted string
        createdAt: profile.createdAt || profile.CreatedAt,
        updatedAt: profile.updatedAt || profile.UpdatedAt,
      };

      console.log('[fetchUserProfile] Normalized profile status:', normalizedProfile.status);
      console.log('[fetchUserProfile] Account status:', normalizedProfile.accountStatus);

      // Check if account is suspended
      if (normalizedProfile.accountStatus === 'Suspended') {
        navigate('/account-suspended');
        return;
      }

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
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Check if error is due to suspension
      if (!handleSuspensionError(error, navigate)) {
        // Check if it's a 404 error (profile not found)
        if (error.message && error.message.includes('Service provider not found')) {
          setSnackbar({
            open: true,
            message: 'Profile not found. Please complete your registration.',
            type: 'error'
          });
          // Redirect to provider onboarding
          setTimeout(() => {
            navigate('/provider-onboarding');
          }, 2000);
        } else {
          // Handle other errors
          console.error('Failed to load profile');
          setSnackbar({
            open: true,
            message: 'Error loading profile. Please try again.',
            type: 'error'
          });
        }
      }
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(userProfileId, 'ServiceProvider', updates);

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'profile',
        'Updated Business Profile',
        updates.displayName ? `Changed display name to ${updates.displayName}` : 'Updated profile information'
      );

      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });

      // Refresh the profile after update
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: 'Error updating profile. Please try again.',
        type: 'error'
      });
      throw error;
    }
  };

  useEffect(() => {
    if (userProfileId) {
        fetchUserProfile();
    }
  }, [userProfileId]);

  // Handle status change with confirmation
  const handleStatusChange = async (newStatus) => {
    const previousStatus = providerStatus;
    
    // Get status descriptions
    const statusDescriptions = {
      'Available': 'You will be visible to customers and can receive new booking requests',
      'Busy': 'You will appear as busy to customers but can still receive booking requests',
      'Unavailable': 'You will not be visible to customers and cannot receive new booking requests'
    };

    setConfirmModal({
      isOpen: true,
      title: `Change Status to ${newStatus}`,
      message: statusDescriptions[newStatus],
      variant: newStatus === 'Available' ? 'success' : newStatus === 'Busy' ? 'warning' : 'danger',
      onConfirm: async () => {
        console.log(`[handleStatusChange] Changing status from '${previousStatus}' to '${newStatus}'`);
        setIsUpdatingStatus(true);
        
        try {
          setProviderStatus(newStatus); // Optimistic update
          const response = await updateProviderStatus(serviceProviderId, newStatus);
          console.log('[handleStatusChange] Update response:', response);

          // Log activity for status change
          logProviderActivity(
            serviceProviderId,
            'profile',
            'Changed Availability Status',
            `Status updated from ${previousStatus} to ${newStatus}`
          );

          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: `Status updated to ${newStatus} successfully!`,
            type: 'success'
          });

          // Trigger activity refresh by updating the key
          setActivityRefreshKey(prev => prev + 1);
        } catch (error) {
          console.error('Error updating provider status:', error);
          // Revert on error
          setProviderStatus(previousStatus);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSnackbar({
            open: true,
            message: 'Error updating status. Please try again.',
            type: 'error'
          });
        } finally {
          setIsUpdatingStatus(false);
        }
      }
    });
  };

  // Handler for navigating from dashboard stats to bookings with filter or view mode
  const handleNavigateToBookings = (statusOrViewMode) => {
    // Check if it's a view mode (weekly/all) or a status filter
    if (statusOrViewMode === 'weekly' || statusOrViewMode === 'all') {
      setBookingViewMode(statusOrViewMode);
      setBookingFilter(null);
    } else {
      setBookingFilter(statusOrViewMode);
      setBookingViewMode(null);
    }
    setActiveTab('bookings');
  };

  // Reset filter and view mode when manually switching to bookings tab
  const handleNavigate = (tabId) => {
    if (tabId === 'bookings' && activeTab !== 'bookings') {
      setBookingFilter(null); // Reset filter when manually clicking bookings tab
      setBookingViewMode(null); // Reset view mode when manually clicking bookings tab
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
          withSearch={activeTab === 'reviews' || activeTab === 'notifications' || activeTab === 'services'}
          searchPlaceholder={
            activeTab === 'notifications'
              ? 'Search notifications by title, content, or type...'
              : activeTab === 'services'
              ? 'Search by service name, category, or description...'
              : 'Search by customer, service, or comment...'
          }
          onSearch={
            activeTab === 'notifications'
              ? setNotificationSearchQuery
              : activeTab === 'services'
              ? setServiceSearchQuery
              : setReviewSearchQuery
          }
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
                  activityRefreshKey={activityRefreshKey}
                  onNavigate={handleNavigate}
                />
              </>
            )}
            {activeTab === 'services' && (
              <ServicesManagement
                serviceProviderId={serviceProviderId}
                searchTerm={serviceSearchQuery}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleManagement
                serviceProviderId={serviceProviderId}
              />
            )}
            {activeTab === 'bookings' && (
              <BookingsManagement
                serviceProviderId={serviceProviderId}
                initialFilter={bookingFilter}
                initialViewMode={bookingViewMode}
              />
            )}
            {activeTab === 'reviews' && (
              <ReviewsManagement
                serviceProviderId={serviceProviderId}
                searchQuery={reviewSearchQuery}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsPage userId={userProfileId} searchQuery={notificationSearchQuery} />
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

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}