import { useEffect, useState } from 'react';
import { getProviderStatistics, getProviderBookings } from '../../../services/api';

export default function ProviderOverview({ serviceProviderId, onNavigateToBookings }) {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [serviceProviderId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch both statistics and all bookings
      const [statisticsData, allBookings] = await Promise.all([
        getProviderStatistics(serviceProviderId),
        getProviderBookings(serviceProviderId) // Get all bookings without filter
      ]);

      setBookings(allBookings);

      // Calculate additional statistics from bookings
      const bookingsByStatus = allBookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {});

      // Calculate monthly revenue (bookings from current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = allBookings
        .filter(b => {
          const bookingDate = new Date(b.createdAt);
          return b.status === 'Completed' && 
                 bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + (b.quotedPrice || 0), 0);

      // Calculate pending revenue (Confirmed + InProgress bookings)
      const pendingRevenue = allBookings
        .filter(b => ['Confirmed', 'InProgress'].includes(b.status))
        .reduce((sum, b) => sum + (b.quotedPrice || 0), 0);

      // TODO: Get average rating from reviews when available
      // For now, we'll set it to null since it's not in the current API
      const averageRating = null;

      // Combine statistics
      const combinedStats = {
        ...statisticsData,
        bookingsByStatus,
        monthlyRevenue,
        pendingRevenue,
        averageRating
      };

      setStats(combinedStats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatClick = (status) => {
    if (onNavigateToBookings) {
      onNavigateToBookings(status);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500">Unable to load statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome Back! 👋</h2>
        <p className="text-blue-100">Here's an overview of your service business</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 rounded-full p-3">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">All Time</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Bookings</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.totalBookings || 0}</p>
        </div>

        {/* Active Services */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 rounded-full p-3">
              <span className="text-2xl">🔧</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">Published</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Services</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.activeServices || 0}</p>
        </div>

        {/* Completed Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 rounded-full p-3">
              <span className="text-2xl">✅</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">Success</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Completed Services</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.completedBookings || 0}</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-yellow-100 rounded-full p-3">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">Earnings</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-800">
            {stats.totalRevenue ? `${stats.totalRevenue.toFixed(2)} BHD` : '0.00 BHD'}
          </p>
        </div>
      </div>

      {/* Booking Statistics - Clickable Cards */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Booking Status Overview</h3>
          <p className="text-sm text-gray-600">Click on any status to view those bookings</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Pending Quote */}
          <button
            onClick={() => handleStatClick('PendingQuote')}
            className="bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 hover:border-yellow-400 rounded-lg p-5 text-center transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-yellow-700">
              {stats.bookingsByStatus?.PendingQuote || 0}
            </div>
            <div className="text-xs text-yellow-600 font-medium mt-1">Pending Quote</div>
          </button>

          {/* Deposit Pending */}
          <button
            onClick={() => handleStatClick('DepositPending')}
            className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-lg p-5 text-center transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl mb-2">💳</div>
            <div className="text-2xl font-bold text-blue-700">
              {stats.bookingsByStatus?.DepositPending || 0}
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1">Deposit Pending</div>
          </button>

          {/* Confirmed */}
          <button
            onClick={() => handleStatClick('Confirmed')}
            className="bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 rounded-lg p-5 text-center transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-700">
              {stats.bookingsByStatus?.Confirmed || 0}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1">Confirmed</div>
          </button>

          {/* In Progress */}
          <button
            onClick={() => handleStatClick('InProgress')}
            className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-lg p-5 text-center transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-2xl font-bold text-purple-700">
              {stats.bookingsByStatus?.InProgress || 0}
            </div>
            <div className="text-xs text-purple-600 font-medium mt-1">In Progress</div>
          </button>

          {/* Completed */}
          <button
            onClick={() => handleStatClick('Completed')}
            className="bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-400 rounded-lg p-5 text-center transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-gray-700">
              {stats.bookingsByStatus?.Completed || 0}
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">Completed</div>
          </button>

          {/* Canceled/Rejected */}
          <button
            onClick={() => handleStatClick('Canceled')}
            className="bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-400 rounded-lg p-5 text-center transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="text-3xl mb-2">❌</div>
            <div className="text-2xl font-bold text-red-700">
              {(stats.bookingsByStatus?.Canceled || 0) + (stats.bookingsByStatus?.Rejected || 0)}
            </div>
            <div className="text-xs text-red-600 font-medium mt-1">Canceled/Rejected</div>
          </button>
        </div>
      </div>

      {/* Recent Activity / Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🚨</span>
            Urgent Actions Required
          </h3>
          
          <div className="space-y-3">
            {stats.bookingsByStatus?.PendingQuote > 0 && (
              <button
                onClick={() => handleStatClick('PendingQuote')}
                className="w-full bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Send Quotes</p>
                    <p className="text-sm text-gray-600">
                      {stats.bookingsByStatus.PendingQuote} booking{stats.bookingsByStatus.PendingQuote > 1 ? 's' : ''} waiting for quote
                    </p>
                  </div>
                  <span className="text-2xl">📤</span>
                </div>
              </button>
            )}

            {stats.bookingsByStatus?.InProgress > 0 && (
              <button
                onClick={() => handleStatClick('InProgress')}
                className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Services in Progress</p>
                    <p className="text-sm text-gray-600">
                      {stats.bookingsByStatus.InProgress} active service{stats.bookingsByStatus.InProgress > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>
              </button>
            )}

            {stats.bookingsByStatus?.Confirmed > 0 && (
              <button
                onClick={() => handleStatClick('Confirmed')}
                className="w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Confirmed Bookings</p>
                    <p className="text-sm text-gray-600">
                      {stats.bookingsByStatus.Confirmed} ready to start
                    </p>
                  </div>
                  <span className="text-2xl">📅</span>
                </div>
              </button>
            )}

            {(!stats.bookingsByStatus?.PendingQuote && !stats.bookingsByStatus?.InProgress && !stats.bookingsByStatus?.Confirmed) && (
              <div className="text-center py-8">
                <p className="text-gray-500">✅ No urgent actions required</p>
                <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📈</span>
            Performance Summary
          </h3>

          <div className="space-y-4">
            {/* Completion Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-bold text-gray-800">
                  {stats.totalBookings > 0 
                    ? Math.round(((stats.completedBookings || 0) / stats.totalBookings) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalBookings > 0 
                      ? ((stats.completedBookings || 0) / stats.totalBookings) * 100
                      : 0}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Response Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Response Rate</span>
                <span className="text-sm font-bold text-gray-800">
                  {stats.totalBookings > 0 
                    ? Math.round((1 - ((stats.pendingBookings || 0) / stats.totalBookings)) * 100)
                    : 100}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalBookings > 0 
                      ? (1 - ((stats.pendingBookings || 0) / stats.totalBookings)) * 100
                      : 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Average Rating - Hidden for now until reviews are implemented */}
            {stats.averageRating && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Customer Satisfaction</span>
                  <span className="text-sm font-bold text-gray-800">
                    {stats.averageRating.toFixed(1)}/5.0
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(stats.averageRating / 5) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Revenue Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">This Month</p>
                  <p className="text-lg font-bold text-green-600">
                    {stats.monthlyRevenue ? `${stats.monthlyRevenue.toFixed(2)}` : '0.00'} BHD
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Pending</p>
                  <p className="text-lg font-bold text-blue-600">
                    {stats.pendingRevenue ? `${stats.pendingRevenue.toFixed(2)}` : '0.00'} BHD
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips & Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-md p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>💡</span>
          Tips for Success
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Respond to quote requests within 24 hours for better customer satisfaction</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Keep your service catalog updated with accurate pricing and descriptions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Maintain high quality service to improve your ratings and get more bookings</span>
          </li>
        </ul>
      </div>
    </div>
  );
}