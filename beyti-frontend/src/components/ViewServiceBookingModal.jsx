import { X, Scissors, MapPin, CreditCard, Calendar, Clock } from '@phosphor-icons/react';
import Button from './Button';
import StatusChip from './StatusChip';
import BookingTimer from './BookingTimer';

export default function ViewServiceBookingModal({ isOpen, onClose, booking, onOpenReview, hasReview, onCancelBooking, onTimerExpire }) {
  if (!isOpen || !booking) return null;

  const handleCancelClick = () => {
    if (onCancelBooking) {
      onCancelBooking(booking);
    }
  };

  const handleTimerExpireLocal = () => {
    if (onTimerExpire) {
      onTimerExpire(booking.id);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'BHD 0.000';
    return `BHD ${Number(amount).toFixed(3)}`;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pending':
      case 'PendingQuote':
      case 'DepositPending':
        return 'warning';
      case 'Confirmed':
      case 'Completed':
        return 'success';
      case 'InProgress':
        return 'brand';
      case 'Canceled':
      case 'Cancelled':
      case 'Rejected':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 dark:bg-charcoal-600 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-cream-50 dark:bg-charcoal-600 border-b border-grey-stroke dark:border-charcoal-400 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
              <Scissors size={24} className="text-sage-600 dark:text-sage-400" />
            </div>
            <div>
              <h2 className="text-display-h3 text-charcoal-600 dark:text-cream-50">Service Booking Details</h2>
              <p className="text-body-small text-charcoal-400 dark:text-charcoal-300">Booking #{booking.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-300 dark:hover:text-cream-50 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timer for Pending Bookings */}
          {booking.status === 'Pending' && booking.createdAt && (
            <div className="bg-warning-bg border-2 border-warning-border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold mb-1">
                    Provider Response Timer
                  </p>
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                    Booking will auto-cancel if provider doesn't respond
                  </p>
                </div>
                <BookingTimer
                  createdAt={booking.createdAt}
                  durationMinutes={1}
                  onExpire={handleTimerExpireLocal}
                />
              </div>
            </div>
          )}

          {/* Status and Booking Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={20} className="text-charcoal-400 dark:text-charcoal-300" />
                <span className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Booking Date</span>
              </div>
              <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                {formatDateTime(booking.createdAt)}
              </p>
            </div>

            <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scissors size={20} className="text-charcoal-400 dark:text-charcoal-300" />
                <span className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Status</span>
              </div>
              <StatusChip variant={getStatusVariant(booking.status)}>
                {booking.status}
              </StatusChip>
            </div>
          </div>

          {/* Service Provider Information */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-3">Service Provider</h3>
            <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
              {booking.businessName || booking.providerName || 'N/A'}
            </p>
          </div>

          {/* Service Details */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-4">Service Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Service Name:</span>
                <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                  {booking.serviceName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Service Type:</span>
                <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                  {booking.serviceType || 'N/A'}
                </span>
              </div>
              {booking.description && (
                <div className="pt-2 border-t border-grey-stroke dark:border-charcoal-400">
                  <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300 block mb-2">Description:</span>
                  <p className="text-body-regular text-charcoal-600 dark:text-cream-50">
                    {booking.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Service Date and Time */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-4">Scheduled Service</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-sage-600 dark:text-sage-400" />
                <div>
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Date</p>
                  <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                    {formatDate(booking.serviceDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-sage-600 dark:text-sage-400" />
                <div>
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Time</p>
                  <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                    {booking.serviceTime || 'Time TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          {(booking.location || booking.address) && (
            <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-charcoal-400 dark:text-charcoal-300" />
                <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50">Location</h3>
              </div>
              <p className="text-body-regular text-charcoal-600 dark:text-cream-50">
                {booking.location || booking.address}
              </p>
            </div>
          )}

          {/* Pricing Details */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={20} className="text-charcoal-400 dark:text-charcoal-300" />
              <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50">Pricing</h3>
            </div>
            <div className="space-y-2">
              {booking.quotedPrice != null && (
                <div className="flex justify-between">
                  <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Quoted Price:</span>
                  <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                    {formatCurrency(booking.quotedPrice)}
                  </span>
                </div>
              )}
              {booking.finalPrice != null && (
                <div className="flex justify-between pt-2 border-t border-grey-stroke dark:border-charcoal-400">
                  <span className="text-body-large text-charcoal-600 dark:text-cream-50 font-semibold">Price Paid:</span>
                  <span className="text-body-large text-sage-600 dark:text-sage-400 font-semibold">
                    {formatCurrency(booking.finalPrice)}
                  </span>
                </div>
              )}
              {booking.finalPrice == null && booking.quotedPrice == null && (
                <p className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Pricing pending</p>
              )}
            </div>
          </div>

          {/* Payment Type */}
          {booking.paymentType && (
            <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
              <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-3">Payment Type</h3>
              <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                {booking.paymentType}
              </p>
            </div>
          )}

          {/* Cancellation Information */}
          {(booking.status === 'Canceled' || booking.status === 'Cancelled') && (booking.canceledBy || booking.cancellationReason) && (
            <div className="bg-error-bg dark:bg-error-bg/20 border-2 border-error-border dark:border-error-border rounded-lg p-4">
              <h3 className="text-card-h3 text-error-text dark:text-error-text mb-4">Cancellation Details</h3>
              <div className="space-y-3">
                {booking.canceledBy && (
                  <div className="flex justify-between">
                    <span className="text-body-regular text-charcoal-600 dark:text-charcoal-300">Cancelled By:</span>
                    <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                      {booking.canceledBy}
                    </span>
                  </div>
                )}
                {booking.cancellationReason && (
                  <div className="pt-2 border-t border-error-border dark:border-error-border/50">
                    <span className="text-body-regular text-charcoal-600 dark:text-charcoal-300 block mb-2">Reason:</span>
                    <p className="text-body-regular text-charcoal-600 dark:text-cream-50">
                      {booking.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
              <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-3">Additional Notes</h3>
              <p className="text-body-regular text-charcoal-600 dark:text-cream-50">
                {booking.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-cream-50 dark:bg-charcoal-600 border-t border-grey-stroke dark:border-charcoal-400 p-6 flex justify-end gap-3">
          {booking.status === 'Pending' && onCancelBooking && (
            <Button
              variant="danger"
              onClick={handleCancelClick}
            >
              Cancel Booking
            </Button>
          )}
          {booking.status === 'Completed' && !hasReview && onOpenReview && (
            <Button
              variant="secondary"
              onClick={() => {
                onOpenReview(booking);
                onClose();
              }}
            >
              Write Review
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
