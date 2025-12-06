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
  UserPlus,
  ShieldCheck,
  Clock
} from '@phosphor-icons/react';
import {
  getDashboardStatistics,
  getServiceProviderRequests,
  getUsers,
  getFlaggedUsers,
  getUserProfile,
  updateUserProfile,
} from '../../services/api';

// Import design system components
import AnalyticsCard from '../../components/AnalyticsCard';
import { Table, TableHeader, TableBody, TableRow } from '../../components/Table';
import StatusChip from '../../components/StatusChip';
import CRUDButton from '../../components/CRUDButton';
import PageHeader from '../../components/PageHeader';

// Import sub-pages
import UsersFlagged from './components/UsersFlagged';
import UserManagement from './components/UserManagement';
import RequestApprovals from './components/RequestApprovals';
import CategoryModeration from './components/CategoryModeration';
import ProductModeration from './components/ProductModeration';
import ServiceModeration from './components/ServiceModeration';
import NotificationsPage from '../ServiceProvider/components/NotificationsPage';
import AuditLogs from './components/AuditLogs';
import AdminSidebar from './components/AdminSidebar';

const AdminView = () => {
  // View state for navigation
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    platformRevenue: 0,
    pendingApprovals: 0,
    flaggedUsersCount: 0,
  });

  // State for approval queue
  const [approvalQueue, setApprovalQueue] = useState([]);

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

  // Recent activity state - storing last 3 admin actions
  const [recentActivity, setRecentActivity] = useState([]);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState("Admin User");

  // Hardcoded login credentials - TODO: Replace with actual authentication/context
  const userProfileId = 4037; // Logged-in admin's UserProfile ID
  const adminProfileId = 1006; // Logged-in admin's ID in AdminProfile table
  const userRole = 'Admin'; // Admin role type

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile(userProfileId);
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
    try {
      await updateUserProfile(userProfileId, userRole, updates);
      // Refresh the profile after update
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Load recent activity from localStorage
  const loadRecentActivity = () => {
    const stored = localStorage.getItem('adminRecentActivity');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentActivity(parsed.slice(0, 3)); // Only keep last 3
      } catch (e) {
        console.error('Error parsing recent activity:', e);
      }
    }
  };

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, [userProfileId]);

  // Load recent activity on mount and when returning to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadRecentActivity();
    }
  }, [currentView]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only fetch dashboard data when on dashboard view
      if (currentView !== 'dashboard') return;

      try {
        setLoading(true);

        // Fetch dashboard statistics
        const statistics = await getDashboardStatistics();
        
        // Fetch all users to calculate growth by role
        const allUsers = await getUsers();
        
        // Fetch pending service provider requests
        const pendingRequests = await getServiceProviderRequests();

        // Fetch flagged users
        const flaggedUsers = await getFlaggedUsers();

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

        // Set approval queue (top 5 pending)
        setApprovalQueue(
          pendingRequests
            .filter(r => r.status === 'Pending')
            .slice(0, 5)
        );

        // Calculate notification count (pending approvals + flagged users)
        setNotificationCount(pendingApprovals + flaggedUsersCount);

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
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString();
  };

  // Navigation handlers
  const handleNavigate = (path) => {
    // Map paths to view states
    const viewMap = {
      '/admin': 'dashboard',
      '/admin/users': 'users',
      '/admin/approvals': 'approvals',
      '/admin/flagged-users': 'flagged-users',
      '/admin/product-moderation': 'product-moderation',
      '/admin/service-moderation': 'service-moderation',
      '/admin/category-moderation': 'category-moderation',
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
      'product-moderation': 'Product Moderation',
      'service-moderation': 'Service Moderation',
      'category-moderation': 'Category Moderation',
      'notifications': 'Notifications',
      'audit-logs': 'Audit Logs',
    };
    return titles[currentView] || 'Admin Dashboard';
  };

  // Get search placeholder based on current view
  const getSearchPlaceholder = () => {
    const placeholders = {
      'users': 'Search by name or role...',
      'approvals': 'Search by business name or provider...',
      'product-moderation': 'Search products, sellers, categories...',
      'service-moderation': 'Search services, categories...',
      'category-moderation': 'Search categories or subcategories...',
      'notifications': 'Search notifications by title, content, or type...',
      'audit-logs': 'Search by event type, description, or table...',
    };
    return placeholders[currentView] || '';
  };

  // Check if current view should have search
  const hasSearch = () => {
    return ['users', 'approvals', 'product-moderation', 'service-moderation', 'category-moderation', 'notifications', 'audit-logs'].includes(currentView);
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
      case 'product-moderation':
        return <ProductModeration onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'service-moderation':
        return <ServiceModeration onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'category-moderation':
        return <CategoryModeration onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      case 'notifications':
        return <NotificationsPage userId={userProfileId} />;
      case 'audit-logs':
        return <AuditLogs onNavigate={handleNavigate} adminUserProfileId={userProfileId} renderContentOnly={true} />;
      default:
        return renderDashboardContent();
    }
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

            {/* Approval Queue */}
            <div>
              <Table
                title="Approval Queue"
                actionButton={
                  <CRUDButton 
                    variant="success"
                    onClick={() => handleNavigate('/admin/approvals')}
                  >
                    View All
                  </CRUDButton>
                }
              >
                <TableHeader
                  columns={[
                    'Business Name',
                    'Service Type',
                    'Submitted',
                    'Status',
                    'Action'
                  ]}
                />
                <TableBody>
                  {loading ? (
                    <TableRow
                      data={['Loading...', '', '', '', '']}
                    />
                  ) : approvalQueue.length === 0 ? (
                    <TableRow
                      data={['No pending approvals', '', '', '', '']}
                    />
                  ) : (
                    approvalQueue.map((request) => (
                      <TableRow
                        key={request.id}
                        data={[
                          request.businessName || 'N/A',
                          request.serviceType || 'General',
                          new Date(request.submittedAt).toLocaleDateString(),
                          <StatusChip variant="danger">
                            {request.status}
                          </StatusChip>,
                        ]}
                        actions={
                          <>
                            <CRUDButton
                              variant="success"
                              onClick={() => handleNavigate('/admin/approvals')}
                            >
                              Review
                            </CRUDButton>
                          </>
                        }
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
                <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Platform Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-body-regular text-charcoal-400 dark:text-gray-400">Total Users</span>
                    <span className="text-body-medium text-charcoal-600 dark:text-white font-semibold">
                      {loading ? '...' : stats.totalUsers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-body-regular text-charcoal-400">Active Sellers</span>
                    <span className="text-body-medium text-charcoal-600 font-semibold">
                      {loading ? '...' : growthData.sellers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-body-regular text-charcoal-400">Service Providers</span>
                    <span className="text-body-medium text-charcoal-600 font-semibold">
                      {loading ? '...' : growthData.serviceProviders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-body-regular text-charcoal-400">Active Drivers</span>
                    <span className="text-body-medium text-charcoal-600 font-semibold">
                      {loading ? '...' : growthData.drivers}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
                <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Recent Activity</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={48} className="text-charcoal-300 mx-auto mb-3" weight="light" />
                    <p className="text-body-regular text-charcoal-400 dark:text-gray-400">No recent activity</p>
                    <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-1">
                      Admin actions will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 pb-4 border-b border-grey-stroke last:border-0 last:pb-0">
                        {/* Icon based on action type */}
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          activity.type === 'approval' ? 'bg-success-bg' :
                          activity.type === 'user_created' ? 'bg-sage-100' :
                          activity.type === 'suspension' ? 'bg-error-bg' :
                          'bg-cream-100'
                        }`}>
                          {activity.type === 'approval' && <CheckCircle size={20} className="text-success-btn" weight="fill" />}
                          {activity.type === 'user_created' && <UserPlus size={20} className="text-sage-600" weight="fill" />}
                          {activity.type === 'suspension' && <Warning size={20} className="text-error-btn" weight="fill" />}
                          {activity.type === 'moderation' && <ShieldCheck size={20} className="text-sage-600" weight="fill" />}
                        </div>

                        {/* Activity details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">
                            {activity.action}
                          </p>
                          {activity.details && (
                            <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-0.5">
                              {activity.details}
                            </p>
                          )}
                          <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-1">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
    </>
  );

  // Main render - Always render sidebar and header, switch content based on view
  return (
    <div className="flex min-h-screen bg-cream-50">
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