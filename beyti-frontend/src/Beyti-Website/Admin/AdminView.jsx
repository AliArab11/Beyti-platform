/**
 * Admin Dashboard - Main View
 * 
 * Central dashboard for Beyti platform administration
 * Displays key metrics, approval queue, and growth analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Warning,
  CheckCircle,
  Clock,
  Bell,
  User,
  GridFour
} from '@phosphor-icons/react';
import {
  getDashboardStatistics,
  getServiceProviderRequests,
  getUsers,
  getFlaggedUsers,
  getUserProfile,
  updateUserProfile,
  createAnnouncement,
  getAuditLogs,
} from '../../services/api';
import { getUserProfileId, getUserRole } from '../../utils/auth';

// Import design system components
import AnalyticsCard from '../../components/AnalyticsCard';
import CRUDButton from '../../components/CRUDButton';
import PageHeader from '../../components/PageHeader';

// Import sub-pages
import UsersFlagged from './components/UsersFlagged';
import UserManagement from './components/UserManagement';
import RequestApprovals from './components/RequestApprovals';
import CategoryModeration from './components/CategoryModeration';
import NotificationsPage from '../ServiceProvider/components/NotificationsPage';
import AuditLogs from './components/AuditLogs';
import AdminSidebar from './components/AdminSidebar';
import ProfilePage from '../../components/ProfilePage';
import AnnouncementManagement from './components/AnnouncementManagement';
import MembershipManagement from './components/MembershipManagement';

const AdminView = () => {
  // View state for navigation
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    platformRevenue: 0,
    pendingApprovals: 0,
    flaggedUsersCount: 0,
  });

  // State for growth data
  const [growthData, setGrowthData] = useState({
    users: 0,
    sellers: 0,
    serviceProviders: 0,
    drivers: 0,
  });

  // Loading state
  const [loading, setLoading] = useState(true);

  // Notification count (placeholder for now)
  const [notificationCount, setNotificationCount] = useState(0);

  // Latest logs state - storing last 3 audit logs
  const [latestLogs, setLatestLogs] = useState([]);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

  // Announcement modal state
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    recipients: {
      customers: false,
      sellers: false,
      serviceProviders: false,
      drivers: false,
    },
  });
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState(null);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // ========================================
  // ADMIN CREDENTIALS - LOADED FROM AUTH
  // ========================================
  // Get admin credentials from localStorage (set during login)
  const userProfileId = getUserProfileId();
  const userRole = getUserRole();
  const adminProfileId = 1;  // Admin Id for announcements

  console.log('Admin View Initialized with:', {
    userProfileId,
    userRole
  });
  // ========================================

  // Fetch user profile details
  const fetchUserProfile = async () => {
    if (!userProfileId) {
      console.warn('User profile ID not available.');
      return;
    }

    try {
      console.log('Fetching user profile for UserProfileId:', userProfileId);
      const profile = await getUserProfile(userProfileId);
      console.log('User profile response:', profile);
      
      if (profile) {
        // API returns PascalCase, convert to camelCase for frontend use
        const normalizedProfile = {
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          status: profile.Status,
          phone: profile.Phone,
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };

        console.log('Normalized profile:', normalizedProfile);
        setUserProfile(normalizedProfile);
        
        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    if (!userProfileId) {
      console.warn('User profile ID not available. Cannot update profile.');
      return;
    }

    try {
      console.log('Updating profile with:', updates);
      await updateUserProfile(userProfileId, userRole, updates);
      // Refresh the profile after update
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Fetch latest 3 audit logs
  const fetchLatestLogs = async () => {
    try {
      const logs = await getAuditLogs();
      // Get the latest 3 logs (sorted by createdAt in descending order)
      const latest = logs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      setLatestLogs(latest);
    } catch (error) {
      console.error('Error fetching latest logs:', error);
    }
  };

  // Fetch user profile on mount
  useEffect(() => {
    console.log('Component mounted, fetching user profile...');
    fetchUserProfile();
  }, [userProfileId]);

  // Fetch latest logs when returning to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchLatestLogs();
    }
  }, [currentView]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only fetch dashboard data when on dashboard view
      if (currentView !== 'dashboard') return;

      try {
        setLoading(true);
        console.log('Fetching dashboard data...');

        // Fetch dashboard statistics
        const statistics = await getDashboardStatistics();
        console.log('Dashboard statistics:', statistics);
        
        // Fetch all users to calculate growth by role
        const allUsers = await getUsers();
        console.log('All users:', allUsers?.length || 0, 'users');
        
        // Fetch pending service provider requests
        const pendingRequests = await getServiceProviderRequests();
        console.log('Pending requests:', pendingRequests?.length || 0);

        // Fetch flagged users
        const flaggedUsers = await getFlaggedUsers();
        console.log('Flagged users response:', flaggedUsers);

        // Calculate statistics
        const totalUsers = allUsers.length;
        const sellers = allUsers.filter(u => u.roleType === 'Seller').length;
        const serviceProviders = allUsers.filter(u => u.roleType === 'ServiceProvider').length;
        const drivers = allUsers.filter(u => u.roleType === 'Driver').length;
        const customers = allUsers.filter(u => u.roleType === 'Customer').length;

        // Count pending approvals (service providers + sellers if applicable)
        const pendingApprovals = pendingRequests.filter(r => r.status === 'Pending').length;

        // Count flagged users - use totalFlagged from API response
        const flaggedUsersCount = flaggedUsers?.totalFlagged || 0;
        console.log('Flagged users count:', flaggedUsersCount);

        // Set statistics
        setStats({
          totalUsers,
          platformRevenue: statistics?.totalRevenue || 0,
          pendingApprovals,
          flaggedUsersCount,
        });

        // Set growth data
        setGrowthData({
          users: customers,
          sellers,
          serviceProviders,
          drivers,
        });

        // Calculate notification count (pending approvals + flagged users)
        setNotificationCount(pendingApprovals + flaggedUsersCount);

        console.log('Dashboard data loaded successfully');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentView]);

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    // Parse the timestamp - backend sends local timestamps using DateTime.Now
    // JavaScript's new Date() will treat timestamps without timezone as local time
    const past = new Date(timestamp);

    // Validate the date
    if (isNaN(past.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return '';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - past) / 1000);

    // Handle negative differences (clock skew or future timestamps)
    if (diffInSeconds < 0) return 'Just now';

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString();
  };

  // Handle opening announcement modal
  const handleOpenAnnouncementModal = () => {
    setAnnouncementModalOpen(true);
    setAnnouncementError(null);
    setAnnouncementSuccess(false);
  };

  // Handle closing announcement modal
  const handleCloseAnnouncementModal = () => {
    setAnnouncementModalOpen(false);
    setAnnouncementForm({
      title: '',
      body: '',
      recipients: {
        customers: false,
        sellers: false,
        serviceProviders: false,
        drivers: false,
      },
    });
    setAnnouncementError(null);
    setAnnouncementSuccess(false);
  };

  // Handle form input changes
  const handleAnnouncementInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle recipient checkbox changes
  const handleRecipientChange = (e) => {
    const { name, checked } = e.target;
    setAnnouncementForm(prev => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        [name]: checked,
      },
    }));
  };

  // Handle select all recipients
  const handleSelectAllRecipients = () => {
    const allSelected = Object.values(announcementForm.recipients).every(v => v);
    setAnnouncementForm(prev => ({
      ...prev,
      recipients: {
        customers: !allSelected,
        sellers: !allSelected,
        serviceProviders: !allSelected,
        drivers: !allSelected,
      },
    }));
  };

  // Handle sending announcement
  const handleSendAnnouncement = async () => {
    // Validation
    if (!announcementForm.title.trim()) {
      setAnnouncementError('Please enter a title for the announcement');
      return;
    }

    if (!announcementForm.body.trim()) {
      setAnnouncementError('Please enter a message for the announcement');
      return;
    }

    const hasRecipients = Object.values(announcementForm.recipients).some(v => v);
    if (!hasRecipients) {
      setAnnouncementError('Please select at least one recipient group');
      return;
    }

    try {
      setAnnouncementLoading(true);
      setAnnouncementError(null);

      // Build audience array from recipients object
      const audiences = [];
      if (announcementForm.recipients.customers) audiences.push('Customer');
      if (announcementForm.recipients.sellers) audiences.push('Seller');
      if (announcementForm.recipients.serviceProviders) audiences.push('ServiceProvider');
      if (announcementForm.recipients.drivers) audiences.push('Driver');

      // Prepare announcement data matching backend DTO structure
      const announcementData = {
        adminUserId: adminProfileId,  // Use adminProfileId (1) not userProfileId (4)
        title: announcementForm.title.trim(),
        message: announcementForm.body.trim(),  // Changed from "body" to "message"
        audiences: audiences,  // Changed from recipients object to array
        expiresAt: null  // Optional: can add expiration date later
      };

      await createAnnouncement(announcementData);

      // Show success
      setAnnouncementSuccess(true);

      // Refresh latest logs after sending announcement
      fetchLatestLogs();

      // Close modal after a delay
      setTimeout(() => {
        handleCloseAnnouncementModal();
      }, 2000);

    } catch (error) {
      console.error('Error sending announcement:', error);
      setAnnouncementError(error.message || 'Failed to send announcement');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // Navigation handlers
  const handleNavigate = (path) => {
    console.log('Navigating to:', path);
    // Map paths to view states
    const viewMap = {
      '/admin': 'dashboard',
      '/admin/users': 'users',
      '/admin/approvals': 'approvals',
      '/admin/flagged-users': 'flagged-users',
      '/admin/category-moderation': 'category-moderation',
      '/admin/membership': 'membership',
      '/admin/announcements': 'announcements',
      '/admin/notifications': 'notifications',
      '/admin/audit-logs': 'audit-logs',
    };

    const view = viewMap[path] || 'dashboard';
    setCurrentView(view);
  };

  // Get page title based on current view
  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Admin Dashboard',
      'users': 'User Management',
      'approvals': 'Request Approvals',
      'flagged-users': 'User Moderation',
      'category-moderation': 'Category Moderation',
      'membership': 'Membership Plans',
      'announcements': 'Announcements',
      'notifications': 'Notifications',
      'audit-logs': 'Audit Logs',
      'profile': 'My Profile',
    };
    return titles[currentView] || 'Admin Dashboard';
  };

  // Get search placeholder based on current view
  const getSearchPlaceholder = () => {
    const placeholders = {
      'users': 'Search by name or role...',
      'approvals': 'Search by business name or provider...',
      'category-moderation': 'Search categories or subcategories...',
      'membership': 'Search plans by name or description...',
      'announcements': 'Search announcements by title or message...',
      'notifications': 'Search notifications by title, content, or type...',
      'audit-logs': 'Search by event type, description, or table...',
    };
    return placeholders[currentView] || '';
  };

  // Check if current view should have search
  const hasSearch = () => {
    return ['users', 'approvals', 'category-moderation', 'membership', 'announcements', 'notifications', 'audit-logs'].includes(currentView);
  };

  // Render the content for each view (without sidebar and header)
  const renderViewContent = () => {
    switch (currentView) {
      case 'users':
        return <UserManagement onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'approvals':
        return <RequestApprovals onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'flagged-users':
        return <UsersFlagged onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'category-moderation':
        return <CategoryModeration onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'membership':
        return <MembershipManagement renderContentOnly={true} />;
      case 'announcements':
        return <AnnouncementManagement onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} onOpenAnnouncementModal={handleOpenAnnouncementModal} />;
      case 'notifications':
        return <NotificationsPage userId={userProfileId} />;
      case 'audit-logs':
        return <AuditLogs onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'profile':
        return (
          <ProfilePage
            userProfile={userProfile}
            userRole="Admin"
            entityId={adminProfileId}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      default:
        return renderDashboardContent();
    }
  };

  // Render announcement modal
  const renderAnnouncementModal = () => {
    if (!announcementModalOpen) return null;

    const allSelected = Object.values(announcementForm.recipients).every(v => v);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-cream-50 dark:bg-[#2A2A2A] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-grey-stroke">
          {/* Header */}
          <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
            <h2 className="text-xl font-semibold text-charcoal-700 dark:text-white">
              Send Announcement
            </h2>
            <button
              type="button"
              onClick={handleCloseAnnouncementModal}
              className="text-charcoal-400 hover:text-charcoal-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Success Message */}
            {announcementSuccess && (
              <div className="bg-success-bg border-l-4 border-success-btn px-4 py-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-success-btn flex-shrink-0" weight="fill" />
                  <div>
                    <p className="text-sm font-semibold text-success-text">
                      Announcement Sent Successfully!
                    </p>
                    <p className="text-sm text-charcoal-600">
                      Your announcement has been sent to the selected recipients.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {announcementError && (
              <div className="bg-error-bg border-l-4 border-error-btn px-4 py-3 rounded-lg">
                <p className="text-sm text-error-text">{announcementError}</p>
              </div>
            )}

            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 dark:text-gray-300 mb-2">
                Announcement Title
              </label>
              <input
                type="text"
                name="title"
                value={announcementForm.title}
                onChange={handleAnnouncementInputChange}
                placeholder="Enter announcement title..."
                className="w-full px-4 py-2.5 rounded-lg border border-grey-stroke bg-white dark:bg-[#1F1F1F] dark:border-gray-600 text-charcoal-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-400"
                disabled={announcementLoading || announcementSuccess}
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-sm font-medium text-charcoal-600 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                name="body"
                value={announcementForm.body}
                onChange={handleAnnouncementInputChange}
                placeholder="Enter your announcement message..."
                rows={6}
                className="w-full px-4 py-2.5 rounded-lg border border-grey-stroke bg-white dark:bg-[#1F1F1F] dark:border-gray-600 text-charcoal-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
                disabled={announcementLoading || announcementSuccess}
              />
            </div>

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-charcoal-600 dark:text-gray-300">
                  Select Recipients
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllRecipients}
                  className="text-sm text-sage-600 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-300 font-medium"
                  disabled={announcementLoading || announcementSuccess}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3 bg-grey-100 dark:bg-[#1F1F1F] rounded-lg p-4 border border-grey-stroke dark:border-gray-600">
                {/* Customers */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="customers"
                    checked={announcementForm.recipients.customers}
                    onChange={handleRecipientChange}
                    className="w-5 h-5 rounded border-grey-stroke text-sage-500 focus:ring-sage-400"
                    disabled={announcementLoading || announcementSuccess}
                  />
                  <span className="text-body-medium text-charcoal-600 dark:text-gray-200">
                    Customers
                  </span>
                </label>

                {/* Sellers */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="sellers"
                    checked={announcementForm.recipients.sellers}
                    onChange={handleRecipientChange}
                    className="w-5 h-5 rounded border-grey-stroke text-sage-500 focus:ring-sage-400"
                    disabled={announcementLoading || announcementSuccess}
                  />
                  <span className="text-body-medium text-charcoal-600 dark:text-gray-200">
                    Sellers
                  </span>
                </label>

                {/* Service Providers */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="serviceProviders"
                    checked={announcementForm.recipients.serviceProviders}
                    onChange={handleRecipientChange}
                    className="w-5 h-5 rounded border-grey-stroke text-sage-500 focus:ring-sage-400"
                    disabled={announcementLoading || announcementSuccess}
                  />
                  <span className="text-body-medium text-charcoal-600 dark:text-gray-200">
                    Service Providers
                  </span>
                </label>

                {/* Drivers */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="drivers"
                    checked={announcementForm.recipients.drivers}
                    onChange={handleRecipientChange}
                    className="w-5 h-5 rounded border-grey-stroke text-sage-500 focus:ring-sage-400"
                    disabled={announcementLoading || announcementSuccess}
                  />
                  <span className="text-body-medium text-charcoal-600 dark:text-gray-200">
                    Drivers
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-grey-stroke bg-grey-100 dark:bg-[#1F1F1F]">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                type="button"
                onClick={handleSendAnnouncement}
                disabled={announcementLoading || announcementSuccess}
                className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:bg-sage-300 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {announcementLoading ? 'Sending...' : announcementSuccess ? 'Sent!' : 'Send Announcement'}
              </button>
              <button
                type="button"
                onClick={handleCloseAnnouncementModal}
                disabled={announcementLoading}
                className="flex-1 bg-grey-300 hover:bg-grey-400 disabled:bg-grey-200 text-charcoal-700 dark:text-charcoal-600 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {announcementSuccess ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render dashboard content
  const renderDashboardContent = () => (
    <>
            {/* Welcome Message */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Welcome back, {displayName}!
              </h2>
            </div>

            {/* Top Row - Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnalyticsCard
                title="Total Users"
                metrics={[
                  {
                    value: loading ? '...' : (stats.totalUsers ?? 0).toString(),
                    label: 'All Platform Users'
                  }
                ]}
              />

              <AnalyticsCard
                title="Platform Revenue"
                metrics={[
                  { 
                    value: loading ? '...' : `$${stats.platformRevenue.toLocaleString()}`, 
                    label: 'Total Revenue' 
                  }
                ]}
              />

              <AnalyticsCard
                title="Pending Approvals"
                metrics={[
                  {
                    value: loading ? '...' : (stats.pendingApprovals ?? 0).toString(),
                    label: 'Awaiting Review'
                  }
                ]}
              />

              <AnalyticsCard
                title="Flagged Users"
                metrics={[
                  {
                    value: loading ? '...' : (stats.flaggedUsersCount ?? 0).toString(),
                    label: 'Require Attention'
                  }
                ]}
              />
            </div>

            {/* User Growth Comparison */}
            <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
              <h2 className="text-card-h2 text-charcoal-600 dark:text-white mb-6">User Growth by Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Users (Customers) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body-regular text-charcoal-400 dark:text-gray-400">Customers</span>
                    <span className="text-metric-h3 text-charcoal-600 dark:text-white">
                      {loading ? '...' : growthData.users}
                    </span>
                  </div>
                  <div className="w-full bg-cream-100 rounded-full h-2">
                    <div 
                      className="bg-sage-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: loading ? '0%' : `${(growthData.users / stats.totalUsers * 100) || 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-label-medium text-charcoal-400">
                    {loading ? '0' : ((growthData.users / stats.totalUsers * 100) || 0).toFixed(1)}% of total
                  </span>
                </div>

                {/* Sellers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body-regular text-charcoal-400">Sellers</span>
                    <span className="text-metric-h3 text-charcoal-600">
                      {loading ? '...' : growthData.sellers}
                    </span>
                  </div>
                  <div className="w-full bg-cream-100 rounded-full h-2">
                    <div 
                      className="bg-success-btn h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: loading ? '0%' : `${(growthData.sellers / stats.totalUsers * 100) || 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-label-medium text-charcoal-400">
                    {loading ? '0' : ((growthData.sellers / stats.totalUsers * 100) || 0).toFixed(1)}% of total
                  </span>
                </div>

                {/* Service Providers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body-regular text-charcoal-400">Service Providers</span>
                    <span className="text-metric-h3 text-charcoal-600">
                      {loading ? '...' : growthData.serviceProviders}
                    </span>
                  </div>
                  <div className="w-full bg-cream-100 rounded-full h-2">
                    <div 
                      className="bg-error-btn h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: loading ? '0%' : `${(growthData.serviceProviders / stats.totalUsers * 100) || 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-label-medium text-charcoal-400">
                    {loading ? '0' : ((growthData.serviceProviders / stats.totalUsers * 100) || 0).toFixed(1)}% of total
                  </span>
                </div>

                {/* Drivers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body-regular text-charcoal-400">Drivers</span>
                    <span className="text-metric-h3 text-charcoal-600">
                      {loading ? '...' : growthData.drivers}
                    </span>
                  </div>
                  <div className="w-full bg-cream-100 rounded-full h-2">
                    <div 
                      className="bg-danger-btn h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: loading ? '0%' : `${(growthData.drivers / stats.totalUsers * 100) || 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-label-medium text-charcoal-400">
                    {loading ? '0' : ((growthData.drivers / stats.totalUsers * 100) || 0).toFixed(1)}% of total
                  </span>
                </div>
              </div>
            </div>

            {/* Flagged Users Alert Section */}
            {stats.flaggedUsersCount > 0 && (
              <div className="bg-error-bg border-l-4 border-error-btn rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <Warning size={24} className="text-error-btn" weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-card-h2 text-error-text">
                        {loading ? '...' : stats.flaggedUsersCount} Flagged User{stats.flaggedUsersCount !== 1 ? 's' : ''}
                      </h3>
                      <p className="text-body-regular text-charcoal-400 mt-1">
                        {stats.flaggedUsersCount === 1 
                          ? 'There is 1 user that requires immediate attention'
                          : `There are ${stats.flaggedUsersCount} users that require immediate attention`
                        }
                      </p>
                    </div>
                  </div>
                  <CRUDButton 
                    variant="error"
                    onClick={() => handleNavigate('/admin/flagged-users')}
                  >
                    View Flagged Users
                  </CRUDButton>
                </div>
              </div>
            )}

            {/* Latest Logs + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Logs */}
              <div className="lg:col-span-2 bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-card-h2 text-charcoal-600 dark:text-white">Latest Logs</h3>
                  <button
                    onClick={() => handleNavigate('/admin/audit-logs')}
                    className="text-body-regular text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 font-medium"
                  >
                    View All
                  </button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
                  </div>
                ) : latestLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={48} className="text-charcoal-300 mx-auto mb-3" weight="light" />
                    <p className="text-body-regular text-charcoal-400 dark:text-gray-400">No logs available</p>
                    <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-1">
                      System activity will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {latestLogs.map((log, index) => {
                      const getSeverityColor = (severity) => {
                        switch (severity) {
                          case 'Critical':
                            return 'bg-error-bg text-error-btn';
                          case 'High':
                            return 'bg-danger-bg text-danger-btn';
                          case 'Medium':
                            return 'bg-warning-bg text-warning-btn';
                          case 'Low':
                            return 'bg-success-bg text-success-btn';
                          default:
                            return 'bg-cream-100 text-charcoal-600';
                        }
                      };

                      return (
                        <div key={log.id || index} className="flex items-start gap-3 pb-4 border-b border-grey-stroke last:border-0 last:pb-0">
                          {/* Icon based on severity */}
                          <div className={`p-2 rounded-lg flex-shrink-0 ${getSeverityColor(log.severity)}`}>
                            {log.severity === 'Critical' && <Warning size={20} weight="fill" />}
                            {log.severity === 'High' && <Warning size={20} weight="fill" />}
                            {log.severity === 'Medium' && <Clock size={20} weight="fill" />}
                            {log.severity === 'Low' && <CheckCircle size={20} weight="fill" />}
                            {!log.severity && <Clock size={20} weight="fill" />}
                          </div>

                          {/* Log details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">
                              {log.eventType}
                            </p>
                            {log.description && (
                              <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-0.5">
                                {log.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-label-medium text-charcoal-300 dark:text-gray-500">
                                {formatTimeAgo(log.createdAt)}
                              </p>
                              {log.actorUserId && (
                                <>
                                  <span className="text-charcoal-300">•</span>
                                  <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                                    User #{log.actorUserId}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
                <h2 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Quick Actions</h2>

                {/* Quick Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleOpenAnnouncementModal}
                    className="w-full flex items-center gap-4 p-4 bg-sage-100 dark:bg-sage-900 hover:bg-sage-200 dark:hover:bg-sage-800 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell size={20} className="text-white" weight="bold" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">Send Announcement</p>
                      <p className="text-label-medium text-charcoal-400 dark:text-gray-400">Broadcast message to all users</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigate('/admin/users')}
                    className="w-full flex items-center gap-4 p-4 bg-cream-100 dark:bg-charcoal-500 hover:bg-cream-200 dark:hover:bg-charcoal-400 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-white" weight="bold" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">View Users</p>
                      <p className="text-label-medium text-charcoal-400 dark:text-gray-400">Manage platform user accounts</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigate('/admin/category-moderation')}
                    className="w-full flex items-center gap-4 p-4 bg-cream-100 dark:bg-charcoal-500 hover:bg-cream-200 dark:hover:bg-charcoal-400 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <GridFour size={20} className="text-white" weight="bold" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">View Categories</p>
                      <p className="text-label-medium text-charcoal-400 dark:text-gray-400">Organize and manage categories</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
    </>
  );

  // Main render - Always render sidebar and header, switch content based on view
  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* Announcement Modal */}
      {renderAnnouncementModal()}

      {/* Sidebar - Always visible */}
      <AdminSidebar currentPage={currentView} onNavigate={handleNavigate} />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header - Always visible, updates based on view */}
        <PageHeader
          title={getPageTitle()}
          withSearch={hasSearch()}
          searchPlaceholder={getSearchPlaceholder()}
          notificationCount={notificationCount}
          userName={displayName}
          userRole="Super Admin"
          userProfile={userProfile}
          entityId={null}
          userId={userProfileId}
          onProfileClick={() => setCurrentView('profile')}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content Area - switches based on view */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderViewContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminView;