import { useEffect, useState } from 'react';
import { getProviderStatistics, getProviderBookings, getServiceReviews } from '../../../services/api';
import AnalyticsCard from '../../../components/AnalyticsCard';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import StatusChip from '../../../components/StatusChip';
import CRUDButton from '../../../components/CRUDButton';
import { getRecentProviderActivities } from '../../../utils/providerActivityLogger';
import QuickAddServiceModal from './QuickAddServiceModal';
import QuickAddScheduleModal from './QuickAddScheduleModal';
import {
  Clock,
  Package,
  CalendarCheck,
  Calendar,
  User,
  Bell,
  Plus,
  ClockClockwise
} from '@phosphor-icons/react';

export default function ProviderOverview({ serviceProviderId, onNavigateToBookings, activityRefreshKey, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (serviceProviderId) {
      fetchDashboardData();
      loadRecentActivity();
    }
  }, [serviceProviderId]);

  // Reload activity when activityRefreshKey changes
  useEffect(() => {
    if (activityRefreshKey > 0) {
      loadRecentActivity();
    }
  }, [activityRefreshKey]);

  // Load recent activity from localStorage - limit to latest 4
  const loadRecentActivity = () => {
    const activities = getRecentProviderActivities(serviceProviderId);
    // Get only the latest 4 activities
    setRecentActivity(activities.slice(0, 4));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch statistics and bookings
      const [statisticsData, allBookings] = await Promise.all([
        getProviderStatistics(serviceProviderId),
        getProviderBookings(serviceProviderId)
      ]);

      console.log('Statistics from backend:', statisticsData);

      // Get today's date (start and end of day in local timezone)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('Filtering bookings for today:', {
        todayStart: today.toISOString(),
        tomorrowStart: tomorrow.toISOString(),
        totalBookings: allBookings.length
      });

      // Log all bookings to see their structure
      console.log('All bookings data:', allBookings);

      // Filter today's bookings based on BookingDateTime (scheduled time)
      const todaysBookings = allBookings.filter(booking => {
        // Use BookingDateTime as the primary field for scheduling
        const bookingDateTimeStr = booking.bookingDateTime || booking.BookingDateTime;

        if (!bookingDateTimeStr) {
          console.warn('Booking missing BookingDateTime:', booking.id || booking.Id);
          return false;
        }

        const bookingDate = new Date(bookingDateTimeStr);
        const isToday = bookingDate >= today && bookingDate < tomorrow;

        if (isToday) {
          console.log('Found today\'s booking:', {
            id: booking.id,
            service: booking.serviceName,
            customer: booking.customerName,
            time: bookingDate.toLocaleString(),
            status: booking.status,
            fullBooking: booking
          });
        }

        return isToday;
      });

      console.log(`Found ${todaysBookings.length} bookings for today`);

      // Sort today's bookings by time (earliest first)
      const sortedTodaysBookings = todaysBookings.sort((a, b) => {
        const dateA = new Date(a.bookingDateTime || a.BookingDateTime);
        const dateB = new Date(b.bookingDateTime || b.BookingDateTime);
        return dateA - dateB;
      });

      setTodayBookings(sortedTodaysBookings);

      // Try to fetch reviews filtered by service provider
      let averageRating = 0;
      try {
        const reviews = await getServiceReviews(serviceProviderId);
        // Sort reviews by creation date and show the last 2
        const sortedReviews = reviews
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2);
        setRecentReviews(sortedReviews);

        // Calculate average rating from all reviews
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0);
          averageRating = totalRating / reviews.length;
        }
      } catch (err) {
        console.log('Reviews not available:', err);
      }

      // FIXED: Use backend statistics directly instead of recalculating
      setStats({
        todayBookings: todaysBookings.length,
        currentRating: averageRating,
        pendingRequests: statisticsData.pendingBookings || 0,  // Use pendingBookings from backend
        totalEarnings: statisticsData.totalEarnings || 0,      // Use totalEarnings from backend
        totalBookings: statisticsData.totalBookings || 0,
        completedBookings: statisticsData.completedBookings || 0,
        activeServices: statisticsData.activeServices || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Confirmed':
        return 'success';
      case 'PendingQuote':
      case 'DepositPending':
        return 'danger';
      case 'InProgress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Canceled':
      case 'Rejected':
        return 'error';
      default:
        return 'danger';
    }
  };

  // Navigate to bookings management with specific booking filter
  const handleViewBookingDetails = (bookingId) => {
    // Navigate to bookings tab and show all bookings so user can see the full details
    if (onNavigateToBookings) {
      onNavigateToBookings(null);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-500' : 'text-charcoal-300 dark:text-gray-600'}`}
          >
            ★
          </span>
        ))}
        <span className="text-body-regular text-charcoal-600 dark:text-white ml-2">
          {rating.toFixed(1)}/5.0
        </span>
      </div>
    );
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-12 text-center border border-transparent dark:border-charcoal-500 transition-colors">
        <p className="text-body-regular text-charcoal-400 dark:text-gray-400">Unable to load statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Requests Alert - Similar to Admin Flagged Users */}
      {stats && stats.pendingRequests > 0 && (
        <div
          onClick={() => onNavigateToBookings && onNavigateToBookings('Pending')}
          className="bg-warning-bg border-2 border-warning-stroke rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-warning-text rounded-full flex items-center justify-center animate-pulse">
                <CalendarCheck size={24} className="text-white" weight="fill" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-card-h3 text-charcoal-600 dark:text-white font-semibold">
                {stats.pendingRequests} Pending Booking Request{stats.pendingRequests > 1 ? 's' : ''}
              </h3>
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                Click here to review and respond to pending booking requests
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-body-medium text-warning-text font-semibold">
                Review Now →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Row - Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Today's Bookings"
          metrics={[
            {
              value: loading ? '...' : stats.todayBookings.toString(),
              label: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            }
          ]}
        />

        <AnalyticsCard
          title="Current Rating"
          metrics={[
            {
              value: loading ? '...' : stats.currentRating > 0 ? stats.currentRating.toFixed(1) : '0.0',
              label: 'Out of 5.0'
            }
          ]}
        />

        <div
          onClick={() => stats.pendingRequests > 0 && onNavigateToBookings && onNavigateToBookings('Pending')}
          className={stats.pendingRequests > 0 ? 'cursor-pointer transition-transform hover:scale-105' : ''}
        >
          <AnalyticsCard
            title="Pending Requests"
            metrics={[
              {
                value: loading ? '...' : stats.pendingRequests.toString(),
                label: stats.pendingRequests > 0 ? 'Click to Review' : 'Awaiting Confirmation'
              }
            ]}
          />
        </div>

        <AnalyticsCard
          title="Total Earnings"
          metrics={[
            {
              value: loading ? '...' : `${stats.totalEarnings.toFixed(3)} BD`,
              label: 'From Completed Bookings'
            }
          ]}
        />
      </div>

      {/* Today's Bookings Table */}
      <div>
        <Table
          title={`Today's Schedule - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
          actionButton={
            <CRUDButton
              variant="success"
              onClick={() => onNavigateToBookings && onNavigateToBookings('schedule')}
            >
              View Schedule
            </CRUDButton>
          }
        >
          <TableHeader
            columns={[
              'Service',
              'Customer',
              'Time',
              'Status',
              'Price',
              'Action'
            ]}
          />
          <TableBody>
            {loading ? (
              <TableRow
                data={['Loading...', '', '', '', '', '']}
              />
            ) : todayBookings.length === 0 ? (
              <TableRow
                data={[`No bookings scheduled for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`, '', '', '', '', '']}
              />
            ) : (
              todayBookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  data={[
                    booking.serviceName || 'N/A',
                    booking.customerName || 'N/A',
                    formatTime(booking.bookingDateTime || booking.BookingDateTime),
                    <StatusChip variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </StatusChip>,
                    booking.quotedPrice ? `${booking.quotedPrice.toFixed(3)} BD` : 'Pending'
                  ]}
                  actions={
                    <>
                      <CRUDButton
                        variant="success"
                        onClick={() => handleViewBookingDetails(booking.id)}
                      >
                        View
                      </CRUDButton>
                    </>
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recent Activity and Quick Actions - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 border border-transparent dark:border-charcoal-500 transition-colors h-[500px] flex flex-col">
          <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Recent Activity</h3>
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center flex-1 flex flex-col justify-center">
              <Clock size={48} className="text-charcoal-300 dark:text-gray-600 mx-auto mb-3" weight="light" />
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400">No recent activity</p>
              <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-1">
                Your actions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-1">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-grey-stroke dark:border-charcoal-500 last:border-0 last:pb-0">
                  {/* Icon based on action type */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    activity.type === 'service' ? 'bg-sage-100 dark:bg-sage-900' :
                    activity.type === 'booking' ? 'bg-success-bg' :
                    activity.type === 'schedule' ? 'bg-cream-100 dark:bg-charcoal-500' :
                    activity.type === 'profile' ? 'bg-cream-100 dark:bg-charcoal-500' :
                    'bg-cream-100 dark:bg-charcoal-500'
                  }`}>
                    {activity.type === 'service' && <Package size={20} className="text-sage-600 dark:text-sage-400" weight="fill" />}
                    {activity.type === 'booking' && <CalendarCheck size={20} className="text-success-btn" weight="fill" />}
                    {activity.type === 'schedule' && <Calendar size={20} className="text-sage-600 dark:text-sage-400" weight="fill" />}
                    {activity.type === 'profile' && <User size={20} className="text-sage-600 dark:text-sage-400" weight="fill" />}
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

        {/* Quick Actions */}
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 border border-transparent dark:border-charcoal-500 transition-colors h-[500px] flex flex-col">
          <h2 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Quick Actions</h2>

          {/* Quick Action Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => setShowServiceModal(true)}
              className="w-full flex items-center gap-4 p-4 bg-sage-100 dark:bg-sage-900 hover:bg-sage-200 dark:hover:bg-sage-800 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            >
              <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Plus size={20} className="text-white" weight="bold" />
              </div>
              <div className="text-left flex-1">
                <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">Add Service</p>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400">Create a new service offering</p>
              </div>
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="w-full flex items-center gap-4 p-4 bg-cream-100 dark:bg-charcoal-500 hover:bg-cream-200 dark:hover:bg-charcoal-400 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            >
              <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ClockClockwise size={20} className="text-white" weight="bold" />
              </div>
              <div className="text-left flex-1">
                <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">Add Timeline</p>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400">Update your availability schedule</p>
              </div>
            </button>
          </div>

          {/* Last 2 Reviews */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-body-medium text-charcoal-600 dark:text-white font-semibold">Recent Reviews</h3>
              {stats.currentRating > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-sm">★</span>
                  <span className="text-label-medium text-charcoal-600 dark:text-white font-medium">
                    {stats.currentRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-500"></div>
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="text-center flex-1 flex flex-col justify-center">
                <span className="text-3xl text-charcoal-300 dark:text-gray-600 mb-2 block">★</span>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1">
                {recentReviews.map((review, index) => (
                  <div
                    key={review.id || index}
                    className="pb-3 border-b border-grey-stroke dark:border-charcoal-500 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                        {review.customer?.fullName || 'Customer'}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= (review.overallRating || 0)
                                ? 'text-yellow-500'
                                : 'text-charcoal-300 dark:text-gray-600'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-label-medium text-charcoal-400 dark:text-gray-400 line-clamp-2">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-label-small text-charcoal-300 dark:text-gray-500 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modals */}
      <QuickAddServiceModal
        serviceProviderId={serviceProviderId}
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSuccess={() => {
          // Optionally refresh data or navigate
          loadRecentActivity();
        }}
      />

      <QuickAddScheduleModal
        serviceProviderId={serviceProviderId}
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          // Optionally refresh data or navigate
          loadRecentActivity();
        }}
      />
    </div>
  );
}