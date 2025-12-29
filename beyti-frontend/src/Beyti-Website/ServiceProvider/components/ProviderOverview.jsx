import { useEffect, useState } from 'react';
import { getProviderStatistics, getProviderBookings, getServiceReviews } from '../../../services/api';
import AnalyticsCard from '../../../components/AnalyticsCard';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import StatusChip from '../../../components/StatusChip';
import CRUDButton from '../../../components/CRUDButton';
import QuickAddServiceModal from './QuickAddServiceModal';
import QuickAddScheduleModal from './QuickAddScheduleModal';
import { useSignalR } from '../../../contexts/SignalRContext';
import {
  CalendarCheck,
  Plus,
  ClockClockwise,
  Calendar,
  ListChecks
} from '@phosphor-icons/react';

export default function ProviderOverview({ serviceProviderId, onNavigateToBookings, activityRefreshKey, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off, isConnected } = useSignalR();
  const [newRequestAnimation, setNewRequestAnimation] = useState(false);

  // Modal States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (serviceProviderId) {
      fetchDashboardData();
    }
  }, [serviceProviderId]);

  // Set up SignalR real-time listeners for new bookings
  useEffect(() => {
    if (!isConnected) return;

    console.log('[ProviderOverview] Setting up SignalR listeners');

    // Handler for new booking received
    const handleBookingUpdate = (message) => {
      console.log('[ProviderOverview] Received booking update:', message);

      if (message.type === 'BookingReceived') {
        console.log('[ProviderOverview] New booking received - updating stats immediately');

        // Trigger animation for new request
        setNewRequestAnimation(true);
        setTimeout(() => setNewRequestAnimation(false), 3000);

        // Immediately increment pending requests count for instant feedback
        setStats(prevStats => {
          if (prevStats) {
            return {
              ...prevStats,
              pendingRequests: prevStats.pendingRequests + 1,
              totalBookings: prevStats.totalBookings + 1
            };
          }
          return prevStats;
        });

        // Also refresh full dashboard data in background to sync everything
        fetchDashboardData(false); // Don't show loading spinner
      }
    };

    // Handler for booking status changes
    const handleBookingStatusChange = (data) => {
      console.log('[ProviderOverview] Booking status changed:', data);
      console.log('[ProviderOverview] Status change details:', {
        bookingId: data.bookingId,
        newStatus: data.newStatus,
        booking: data.booking
      });

      // Update stats based on status change
      setStats(prevStats => {
        if (!prevStats) return prevStats;

        const updatedStats = { ...prevStats };

        // If status changed FROM Pending to something else, decrement pending
        if (data.newStatus !== 'Pending') {
          updatedStats.pendingRequests = Math.max(0, prevStats.pendingRequests - 1);
        }

        // If status changed TO Completed, increment completed bookings and update earnings
        if (data.newStatus === 'Completed' && data.booking?.quotedPrice) {
          updatedStats.completedBookings = prevStats.completedBookings + 1;
          updatedStats.totalEarnings = prevStats.totalEarnings + (data.booking.quotedPrice || 0);
        }

        return updatedStats;
      });

      // Refresh full dashboard to sync and update today's bookings
      fetchDashboardData(false);
    };

    // Register SignalR event listeners
    on('ReceiveBookingUpdate', handleBookingUpdate);
    on('ReceiveBookingStatusChange', handleBookingStatusChange);

    return () => {
      console.log('[ProviderOverview] Cleaning up SignalR listeners');
      off('ReceiveBookingUpdate', handleBookingUpdate);
      off('ReceiveBookingStatusChange', handleBookingStatusChange);
    };
  }, [isConnected, on, off]);

  const fetchDashboardData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }

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
        // Sort reviews by creation date and show the last 3
        const sortedReviews = reviews
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
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
          className={`bg-warning-bg border-2 border-warning-stroke rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] ${
            newRequestAnimation ? 'animate-[pulse_1s_ease-in-out_3] ring-4 ring-warning-text ring-opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 bg-warning-text rounded-full flex items-center justify-center ${
                newRequestAnimation ? 'animate-[bounce_0.5s_ease-in-out_3]' : 'animate-pulse'
              }`}>
                <CalendarCheck size={24} className="text-white" weight="fill" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-card-h3 text-charcoal-600 dark:text-white font-semibold">
                {stats.pendingRequests} Pending Booking Request{stats.pendingRequests > 1 ? 's' : ''}
                {newRequestAnimation && (
                  <span className="ml-2 text-warning-text animate-pulse">● NEW</span>
                )}
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
          className={`${stats.pendingRequests > 0 ? 'cursor-pointer transition-transform hover:scale-105' : ''} ${
            newRequestAnimation ? 'animate-[pulse_0.5s_ease-in-out_3]' : ''
          }`}
        >
          <AnalyticsCard
            title={
              <div className="flex items-center gap-2">
                Pending Requests
                {newRequestAnimation && stats.pendingRequests > 0 && (
                  <span className="w-2 h-2 bg-warning-text rounded-full animate-pulse"></span>
                )}
              </div>
            }
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

      {/* Recent Reviews and Quick Actions - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 border border-transparent dark:border-charcoal-500 transition-colors h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-card-h2 text-charcoal-600 dark:text-white">Recent Reviews</h3>
            {stats.currentRating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-lg">★</span>
                <span className="text-body-medium text-charcoal-600 dark:text-white font-medium">
                  {stats.currentRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
            </div>
          ) : recentReviews.length === 0 ? (
            <div className="text-center flex-1 flex flex-col justify-center">
              <span className="text-5xl text-charcoal-300 dark:text-gray-600 mb-3 block">★</span>
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400">No reviews yet</p>
              <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-1">
                Reviews from customers will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-1">
              {recentReviews.map((review, index) => (
                <div
                  key={review.id || index}
                  className="pb-4 border-b border-grey-stroke dark:border-charcoal-500 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">
                        {review.customer?.fullName || 'Customer'}
                      </p>
                      <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                        {review.service?.name || 'Service'}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-base ${
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
                    <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mb-2 line-clamp-3">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-label-small text-charcoal-300 dark:text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 border border-transparent dark:border-charcoal-500 transition-colors h-[500px] flex flex-col">
          <h2 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">Quick Actions</h2>

          {/* Quick Action Buttons */}
          <div className="space-y-3">
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

            <button
              onClick={() => {
                onNavigate && onNavigate('bookings');
                if (onNavigateToBookings) {
                  onNavigateToBookings('weekly');
                }
              }}
              className="w-full flex items-center gap-4 p-4 bg-cream-100 dark:bg-charcoal-500 hover:bg-cream-200 dark:hover:bg-charcoal-400 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            >
              <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-white" weight="bold" />
              </div>
              <div className="text-left flex-1">
                <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">View Schedule</p>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400">See your weekly schedule</p>
              </div>
            </button>

            <button
              onClick={() => {
                onNavigate && onNavigate('bookings');
                if (onNavigateToBookings) {
                  onNavigateToBookings('all');
                }
              }}
              className="w-full flex items-center gap-4 p-4 bg-cream-100 dark:bg-charcoal-500 hover:bg-cream-200 dark:hover:bg-charcoal-400 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            >
              <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ListChecks size={20} className="text-white" weight="bold" />
              </div>
              <div className="text-left flex-1">
                <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">View All Bookings</p>
                <p className="text-label-medium text-charcoal-400 dark:text-gray-400">Browse all booking requests</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modals */}
      <QuickAddServiceModal
        serviceProviderId={serviceProviderId}
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSuccess={() => {
          // Optionally refresh data
          fetchDashboardData();
        }}
      />

      <QuickAddScheduleModal
        serviceProviderId={serviceProviderId}
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          // Optionally refresh data
          fetchDashboardData();
        }}
      />
    </div>
  );
}