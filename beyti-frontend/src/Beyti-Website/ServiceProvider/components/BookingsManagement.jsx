import { useEffect, useState } from 'react';
import { getProviderBookings, updateBookingStatus } from '../../../services/api';

export default function BookingsManagement({ serviceProviderId, initialFilter = null }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(initialFilter || '');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' or 'all'

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getProviderBookings(serviceProviderId, filterStatus || null);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [serviceProviderId, filterStatus]);

  // Update filter when initialFilter prop changes (from dashboard click)
  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
      setViewMode('all');
    }
  }, [initialFilter]);

  const handleSendQuote = async () => {
    if (!quotePrice || parseFloat(quotePrice) <= 0) {
      alert('Please enter a valid quote price');
      return;
    }

    try {
      await updateBookingStatus(selectedBooking.id, {
        status: 'DepositPending',
        quotedPrice: parseFloat(quotePrice)
      });
      alert('Quote sent successfully!');
      setShowQuoteModal(false);
      setSelectedBooking(null);
      setQuotePrice('');
      fetchBookings();
    } catch (err) {
      console.error('Error sending quote:', err);
      alert('Error sending quote');
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, { status: newStatus });
      fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating booking status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PendingQuote: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      DepositPending: 'bg-blue-100 text-blue-800 border border-blue-300',
      Confirmed: 'bg-green-100 text-green-800 border border-green-300',
      InProgress: 'bg-purple-100 text-purple-800 border border-purple-300',
      Completed: 'bg-gray-100 text-gray-800 border border-gray-300',
      Canceled: 'bg-red-100 text-red-800 border border-red-300',
      Rejected: 'bg-red-100 text-red-800 border border-red-300'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Filter upcoming bookings (PendingQuote, Confirmed, InProgress)
  const upcomingBookings = bookings.filter(b => 
    ['PendingQuote', 'Confirmed', 'InProgress'].includes(b.status)
  );

  // Get displayed bookings based on view mode and filter
  const displayedBookings = viewMode === 'upcoming' 
    ? upcomingBookings 
    : filterStatus 
      ? bookings.filter(b => b.status === filterStatus)
      : bookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with View Toggle and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Service Bookings</h2>
            <p className="text-gray-600 text-sm mt-1">
              {viewMode === 'upcoming' 
                ? `${upcomingBookings.length} upcoming bookings` 
                : `${displayedBookings.length} bookings`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode('upcoming');
                  setFilterStatus('');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'upcoming'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📌 Upcoming
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 All Bookings
              </button>
            </div>

            {/* Status Filter (only shown in 'all' view) */}
            {viewMode === 'all' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Filter:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="PendingQuote">Pending Quote</option>
                  <option value="DepositPending">Deposit Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats for Upcoming View */}
        {viewMode === 'upcoming' && upcomingBookings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {upcomingBookings.filter(b => b.status === 'PendingQuote').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Needs Quote</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {upcomingBookings.filter(b => b.status === 'Confirmed').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {upcomingBookings.filter(b => b.status === 'InProgress').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">In Progress</div>
            </div>
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {displayedBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{booking.serviceName}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-sm text-gray-600">Category: {booking.category}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Customer:</span> {booking.customerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Phone:</span> {booking.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Service Type:</span> {booking.serviceType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Date:</span>{' '}
                    {new Date(booking.bookingDateTime).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 mb-1">Service Address:</p>
                <p className="text-sm text-gray-700">
                  {booking.address.street}, {booking.address.city}
                </p>
                {booking.address.latitude && booking.address.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${booking.address.latitude},${booking.address.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    📍 View on Map
                  </a>
                )}
              </div>

              {/* Pricing */}
              {booking.quotedPrice && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Quoted Price</p>
                      <p className="text-lg font-bold text-gray-800">{booking.quotedPrice} BHD</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Deposit (50%)</p>
                      <p className="text-lg font-bold text-green-600">{booking.depositAmount} BHD</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Final Payment</p>
                      <p className="text-lg font-bold text-blue-600">{booking.finalAmount} BHD</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800">Customer Notes:</p>
                  <p className="text-sm text-gray-700 mt-1">{booking.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {booking.status === 'PendingQuote' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowQuoteModal(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      📤 Send Quote
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reject this booking?')) {
                          handleStatusChange(booking.id, 'Rejected');
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}

                {booking.status === 'DepositPending' && (
                  <div className="w-full text-center py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-700 font-medium">⏳ Waiting for customer to pay deposit...</p>
                  </div>
                )}

                {booking.status === 'Confirmed' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'InProgress')}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    ▶️ Start Service
                  </button>
                )}

                {booking.status === 'InProgress' && (
                  <button
                    onClick={() => handleStatusChange(booking.id, 'Completed')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    ✅ Mark Complete
                  </button>
                )}

                {booking.status === 'Completed' && (
                  <div className="w-full text-center py-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">✅ Service Completed</p>
                  </div>
                )}

                {booking.status === 'Rejected' && (
                  <div className="w-full text-center py-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">❌ Booking Rejected</p>
                  </div>
                )}

                {booking.status === 'Canceled' && (
                  <div className="w-full text-center py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700 font-medium">🚫 Booking Canceled</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayedBookings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">
            {viewMode === 'upcoming' ? '📌' : '📋'}
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {viewMode === 'upcoming' 
              ? 'No upcoming bookings' 
              : filterStatus 
                ? `No ${filterStatus} bookings found`
                : 'No bookings found'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {viewMode === 'upcoming' 
              ? 'Pending and active bookings will appear here'
              : filterStatus 
                ? 'Try changing the filter'
                : 'All your bookings will appear here'}
          </p>
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Send Quote</h3>
              <p className="text-sm text-gray-600 mt-1">
                for {selectedBooking.serviceName}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Customer:</span> {selectedBooking.customerName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Service:</span> {selectedBooking.serviceName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Date:</span>{' '}
                  {new Date(selectedBooking.bookingDateTime).toLocaleString()}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quote Price (BHD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter price (e.g., 25.00)"
                  autoFocus
                />
                {quotePrice && parseFloat(quotePrice) > 0 && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Deposit (50%):</span>{' '}
                      <span className="text-blue-600 font-bold">
                        {(parseFloat(quotePrice) * 0.5).toFixed(2)} BHD
                      </span>
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Final Payment (50%):</span>{' '}
                      <span className="text-green-600 font-bold">
                        {(parseFloat(quotePrice) * 0.5).toFixed(2)} BHD
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendQuote}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={!quotePrice || parseFloat(quotePrice) <= 0}
                >
                  📤 Send Quote
                </button>
                <button
                  onClick={() => {
                    setShowQuoteModal(false);
                    setSelectedBooking(null);
                    setQuotePrice('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}