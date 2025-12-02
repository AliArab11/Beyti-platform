import { useEffect, useState } from 'react';
import { getProviderStatistics, getProviderBookings, getServiceReviews } from '../../../services/api';
import AnalyticsCard from '../../../components/AnalyticsCard';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import StatusChip from '../../../components/StatusChip';
import CRUDButton from '../../../components/CRUDButton';

export default function ProviderOverview({ serviceProviderId, onNavigateToBookings }) {
  const [stats, setStats] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [serviceProviderId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch statistics and bookings
      const [statisticsData, allBookings] = await Promise.all([
        getProviderStatistics(serviceProviderId),
        getProviderBookings(serviceProviderId)
      ]);

      // Get today's date (start and end of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter today's bookings
      const todaysBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.scheduledDate || booking.createdAt);
        return bookingDate >= today && bookingDate < tomorrow;
      });

      setTodayBookings(todaysBookings);

      // Calculate pending requests (PendingQuote status)
      const pendingRequests = allBookings.filter(b => b.status === 'PendingQuote').length;

      // Calculate total earnings from completed bookings
      const totalEarnings = allBookings
        .filter(b => b.status === 'Completed' && b.quotedPrice)
        .reduce((sum, booking) => sum + (booking.quotedPrice || 0), 0);

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

      setStats({
        todayBookings: todaysBookings.length,
        currentRating: averageRating,
        pendingRequests,
        totalEarnings,
        ...statisticsData
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
      {/* Top Row - Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Today's Bookings"
          metrics={[
            {
              value: loading ? '...' : stats.todayBookings.toString(),
              label: 'Scheduled for Today'
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

        <AnalyticsCard
          title="Pending Requests"
          metrics={[
            {
              value: loading ? '...' : stats.pendingRequests.toString(),
              label: 'Awaiting Quote'
            }
          ]}
        />

        <AnalyticsCard
          title="Total Earnings"
          metrics={[
            {
              value: loading ? '...' : `${stats.totalEarnings.toFixed(2)} BHD`,
              label: 'From Completed Bookings'
            }
          ]}
        />
      </div>

      {/* Today's Bookings Table */}
      <div>
        <Table
          title="Today's Bookings"
          actionButton={
            <CRUDButton
              variant="success"
              onClick={() => onNavigateToBookings && onNavigateToBookings(null)}
            >
              View All Bookings
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
                data={['No bookings scheduled for today', '', '', '', '', '']}
              />
            ) : (
              todayBookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  data={[
                    booking.serviceName || 'N/A',
                    booking.customerName || 'N/A',
                    formatTime(booking.scheduledDate || booking.createdAt),
                    <StatusChip variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </StatusChip>,
                    booking.quotedPrice ? `${booking.quotedPrice.toFixed(2)} BHD` : 'Pending'
                  ]}
                  actions={
                    <>
                      <CRUDButton
                        variant="success"
                        onClick={() => {/* TODO: Implement view details */}}
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

      {/* Recent Reviews */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 border border-transparent dark:border-charcoal-500 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-card-h2 text-charcoal-600 dark:text-white">Recent Reviews</h2>
          {stats.currentRating > 0 && (
            <div className="flex items-center gap-2">
              {renderStarRating(stats.currentRating)}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
          </div>
        ) : recentReviews.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-5xl text-charcoal-300 dark:text-gray-600 mb-3 block">★</span>
            <p className="text-body-regular text-charcoal-400 dark:text-gray-400">No reviews yet</p>
            <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-1">
              Complete services to receive customer reviews
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
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
                  <span className="text-label-medium text-charcoal-300 dark:text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-2">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
