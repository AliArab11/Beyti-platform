import { useEffect, useState } from 'react';
import { getProviderBookings, updateBookingStatus } from '../../../services/api';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { logProviderActivity } from '../../../utils/providerActivityLogger';

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

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'booking',
        'Sent Quote',
        `Customer: ${selectedBooking.customerName || 'N/A'} - ${parseFloat(quotePrice).toFixed(2)} BHD`
      );

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
      const booking = bookings.find(b => b.id === bookingId);
      await updateBookingStatus(bookingId, { status: newStatus });

      // Log activity
      const actionMap = {
        'Confirmed': 'Confirmed Booking',
        'InProgress': 'Started Service',
        'Completed': 'Completed Service',
        'Canceled': 'Canceled Booking',
        'Rejected': 'Rejected Booking'
      };
      logProviderActivity(
        serviceProviderId,
        'booking',
        actionMap[newStatus] || 'Updated Booking',
        `Customer: ${booking?.customerName || 'N/A'}`
      );

      fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating booking status');
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

  const upcomingBookings = bookings.filter(b =>
    ['PendingQuote', 'Confirmed', 'InProgress'].includes(b.status)
  );

  const displayedBookings = viewMode === 'upcoming'
    ? upcomingBookings
    : filterStatus
      ? bookings.filter(b => b.status === filterStatus)
      : bookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle and Filters */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-card-h2 text-charcoal-600 dark:text-white">Service Bookings</h2>
            <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
              {viewMode === 'upcoming'
                ? `${upcomingBookings.length} upcoming bookings`
                : `${displayedBookings.length} bookings`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-cream-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode('upcoming');
                  setFilterStatus('');
                }}
                className={`px-4 py-2 rounded-md text-label-medium font-medium transition-colors ${
                  viewMode === 'upcoming'
                    ? 'bg-grey-200 dark:bg-[#2A2A2A] text-sage-600 shadow-sm'
                    : 'text-charcoal-400 dark:text-gray-400 hover:text-charcoal-600 dark:hover:text-white'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-md text-label-medium font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-grey-200 dark:bg-[#2A2A2A] text-sage-600 shadow-sm'
                    : 'text-charcoal-400 dark:text-gray-400 hover:text-charcoal-600 dark:hover:text-white'
                }`}
              >
                All Bookings
              </button>
            </div>

            {/* Status Filter */}
            {viewMode === 'all' && (
              <div className="flex items-center gap-2">
                <label className="text-body-medium text-charcoal-600 dark:text-white">Filter:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
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

        {/* Quick Stats */}
        {viewMode === 'upcoming' && upcomingBookings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-grey-stroke">
            <div className="text-center">
              <div className="text-metric-h3 text-yellow-500">
                {upcomingBookings.filter(b => b.status === 'PendingQuote').length}
              </div>
              <div className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">Needs Quote</div>
            </div>
            <div className="text-center">
              <div className="text-metric-h3 text-success-btn">
                {upcomingBookings.filter(b => b.status === 'Confirmed').length}
              </div>
              <div className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-metric-h3 text-sage-600">
                {upcomingBookings.filter(b => b.status === 'InProgress').length}
              </div>
              <div className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">In Progress</div>
            </div>
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {displayedBookings.map((booking) => (
          <div key={booking.id} className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none overflow-hidden hover:shadow-lg transition-colors">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-card-h3 text-charcoal-600 dark:text-white">{booking.serviceName}</h3>
                    <StatusChip variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </StatusChip>
                  </div>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400">Category: {booking.category}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-cream-50 rounded-lg">
                <div>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                    <span className="font-semibold text-charcoal-600 dark:text-white">Customer:</span> {booking.customerName}
                  </p>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                    <span className="font-semibold text-charcoal-600 dark:text-white">Phone:</span> {booking.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                    <span className="font-semibold text-charcoal-600 dark:text-white">Service Type:</span> {booking.serviceType}
                  </p>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                    <span className="font-semibold text-charcoal-600 dark:text-white">Date:</span>{' '}
                    {new Date(booking.bookingDateTime).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="mb-4 p-4 bg-sage-100 rounded-lg">
                <p className="text-body-medium font-semibold text-sage-700 mb-1">Service Address:</p>
                <p className="text-body-regular text-charcoal-600 dark:text-white">
                  {booking.address.street}, {booking.address.city}
                </p>
                {booking.address.latitude && booking.address.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${booking.address.latitude},${booking.address.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-regular text-sage-600 hover:underline mt-1 inline-block"
                  >
                    View on Map
                  </a>
                )}
              </div>

              {/* Pricing */}
              {booking.quotedPrice && (
                <div className="mb-4 p-4 bg-success-bg rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-body-regular text-charcoal-400 dark:text-gray-400">Quoted Price</p>
                      <p className="text-card-h3 text-charcoal-600 dark:text-white">{booking.quotedPrice} BHD</p>
                    </div>
                    <div>
                      <p className="text-body-regular text-charcoal-400 dark:text-gray-400">Deposit (50%)</p>
                      <p className="text-card-h3 text-success-btn">{booking.depositAmount} BHD</p>
                    </div>
                    <div>
                      <p className="text-body-regular text-charcoal-400 dark:text-gray-400">Final Payment</p>
                      <p className="text-card-h3 text-sage-600">{booking.finalAmount} BHD</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="mb-4 p-3 bg-warning-bg border border-warning-btn rounded-lg">
                  <p className="text-body-medium font-semibold text-warning-text">Customer Notes:</p>
                  <p className="text-body-regular text-charcoal-600 dark:text-white mt-1">{booking.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {booking.status === 'PendingQuote' && (
                  <>
                    <CRUDButton
                      variant="success"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowQuoteModal(true);
                      }}
                      className="flex-1"
                    >
                      Send Quote
                    </CRUDButton>
                    <CRUDButton
                      variant="error"
                      onClick={() => {
                        if (confirm('Are you sure you want to reject this booking?')) {
                          handleStatusChange(booking.id, 'Rejected');
                        }
                      }}
                      className="flex-1"
                    >
                      Reject
                    </CRUDButton>
                  </>
                )}

                {booking.status === 'DepositPending' && (
                  <div className="w-full text-center py-3 bg-warning-bg border border-warning-btn rounded-lg">
                    <p className="text-warning-text text-body-medium font-medium">Waiting for customer to pay deposit...</p>
                  </div>
                )}

                {booking.status === 'Confirmed' && (
                  <CRUDButton
                    variant="warning"
                    onClick={() => handleStatusChange(booking.id, 'InProgress')}
                    className="flex-1"
                  >
                    Start Service
                  </CRUDButton>
                )}

                {booking.status === 'InProgress' && (
                  <CRUDButton
                    variant="success"
                    onClick={() => handleStatusChange(booking.id, 'Completed')}
                    className="flex-1"
                  >
                    Mark Complete
                  </CRUDButton>
                )}

                {booking.status === 'Completed' && (
                  <div className="w-full text-center py-3 bg-success-bg border border-success-btn rounded-lg">
                    <p className="text-success-text text-body-medium font-medium">Service Completed</p>
                  </div>
                )}

                {booking.status === 'Rejected' && (
                  <div className="w-full text-center py-3 bg-error-bg border border-error-btn rounded-lg">
                    <p className="text-error-text text-body-medium font-medium">Booking Rejected</p>
                  </div>
                )}

                {booking.status === 'Canceled' && (
                  <div className="w-full text-center py-3 bg-cream-100 border border-grey-stroke rounded-lg">
                    <p className="text-charcoal-400 text-body-medium font-medium">Booking Canceled</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayedBookings.length === 0 && (
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-12 text-center transition-colors">
          <div className="text-6xl mb-4">
            {viewMode === 'upcoming' ? '📌' : '📋'}
          </div>
          <p className="text-body-regular text-charcoal-400 dark:text-gray-400 font-medium">
            {viewMode === 'upcoming'
              ? 'No upcoming bookings'
              : filterStatus
                ? `No ${filterStatus} bookings found`
                : 'No bookings found'}
          </p>
          <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-2">
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
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-xl max-w-md w-full transition-colors">
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
              <h3 className="text-card-h2 text-charcoal-600 dark:text-white">Send Quote</h3>
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                for {selectedBooking.serviceName}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-cream-50 rounded-lg">
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mb-2">
                  <span className="font-semibold text-charcoal-600 dark:text-white">Customer:</span> {selectedBooking.customerName}
                </p>
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                  <span className="font-semibold text-charcoal-600 dark:text-white">Service:</span> {selectedBooking.serviceName}
                </p>
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                  <span className="font-semibold text-charcoal-600 dark:text-white">Date:</span>{' '}
                  {new Date(selectedBooking.bookingDateTime).toLocaleString()}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">
                  Quote Price (BHD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-3 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  placeholder="Enter price (e.g., 25.00)"
                  autoFocus
                />
                {quotePrice && parseFloat(quotePrice) > 0 && (
                  <div className="mt-3 p-4 bg-sage-100 rounded-lg border border-sage-300">
                    <p className="text-body-regular text-charcoal-600 dark:text-white mb-1">
                      <span className="font-semibold">Deposit (50%):</span>{' '}
                      <span className="text-sage-600 font-bold">
                        {(parseFloat(quotePrice) * 0.5).toFixed(2)} BHD
                      </span>
                    </p>
                    <p className="text-body-regular text-charcoal-600 dark:text-white">
                      <span className="font-semibold">Final Payment (50%):</span>{' '}
                      <span className="text-success-btn font-bold">
                        {(parseFloat(quotePrice) * 0.5).toFixed(2)} BHD
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <CRUDButton
                  variant="success"
                  onClick={handleSendQuote}
                  disabled={!quotePrice || parseFloat(quotePrice) <= 0}
                  className="flex-1"
                >
                  Send Quote
                </CRUDButton>
                <CRUDButton
                  variant="error"
                  onClick={() => {
                    setShowQuoteModal(false);
                    setSelectedBooking(null);
                    setQuotePrice('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </CRUDButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
