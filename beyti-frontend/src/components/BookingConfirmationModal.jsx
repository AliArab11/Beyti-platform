import { useState } from 'react';
import { X, MapPin, Calendar, Clock, User, Phone, Wrench, CreditCard, X as XCircle } from '@phosphor-icons/react';
import BookingTimer from './BookingTimer';

/**
 * BookingConfirmationModal Component
 *
 * Displays booking details with a 1-minute timer
 * Allows customer to cancel the booking before provider accepts
 * Auto-cancels if provider doesn't respond within 1 minute
 *
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close modal callback
 * @param {object} booking - Booking data object
 * @param {function} onCancel - Cancel booking callback
 */
export default function BookingConfirmationModal({ isOpen, onClose, booking, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  if (!isOpen || !booking) return null;

  const handleTimerExpire = async () => {
    // Auto-cancel when timer expires
    try {
      await onCancel(booking.id, booking, 'Cancelled by System', 'No response from provider');
      onClose();
    } catch (error) {
      console.error('Error auto-cancelling booking:', error);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancelling(true);
      await onCancel(booking.id, booking, booking.customerName, cancellationReason);
      setShowCancelConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-cream-50 dark:bg-charcoal-600 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 p-6 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
              Booking Confirmed!
            </h2>
            <p className="text-sage-100 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Waiting for provider confirmation
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all"
          >
            <X size={24} weight="bold" className="text-white" />
          </button>
        </div>

        {/* Timer Section - Prominent */}
        <div className="bg-warning-bg border-b-4 border-warning-border p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-label-medium text-charcoal-600 dark:text-white mb-1">
                Provider Response Timer
              </p>
              <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                Booking will auto-cancel if provider doesn't respond
              </p>
            </div>
            <BookingTimer
              createdAt={booking.createdAt}
              durationMinutes={1}
              onExpire={handleTimerExpire}
            />
          </div>
        </div>

        {/* Booking Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Service Information */}
          <div className="bg-white dark:bg-charcoal-500 rounded-xl p-4 border border-grey-stroke dark:border-charcoal-400">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                <Wrench size={20} className="text-sage-600 dark:text-sage-400" weight="bold" />
              </div>
              <div className="flex-1">
                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-1">Service</p>
                <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">
                  {booking.serviceName}
                </p>
                {booking.category && (
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                    {booking.category} • {booking.serviceType}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div className="bg-white dark:bg-charcoal-500 rounded-xl p-4 border border-grey-stroke dark:border-charcoal-400">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-sage-600 dark:text-sage-400" weight="bold" />
              </div>
              <div className="flex-1">
                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-1">Provider</p>
                <p className="text-body-medium text-charcoal-600 dark:text-white font-semibold">
                  {booking.businessName || booking.providerName || 'Service Provider'}
                </p>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-charcoal-500 rounded-xl p-4 border border-grey-stroke dark:border-charcoal-400">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-sage-600 dark:text-sage-400" weight="bold" />
                </div>
                <div className="flex-1">
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-1">Date</p>
                  <p className="text-body-small text-charcoal-600 dark:text-white font-semibold">
                    {formatDate(booking.bookingDateTime || booking.serviceDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-charcoal-500 rounded-xl p-4 border border-grey-stroke dark:border-charcoal-400">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-sage-600 dark:text-sage-400" weight="bold" />
                </div>
                <div className="flex-1">
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-1">Time</p>
                  <p className="text-body-small text-charcoal-600 dark:text-white font-semibold">
                    {formatTime(booking.bookingDateTime) || booking.serviceTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          {booking.address && (
            <div className="bg-white dark:bg-charcoal-500 rounded-xl p-4 border border-grey-stroke dark:border-charcoal-400">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-sage-600 dark:text-sage-400" weight="bold" />
                </div>
                <div className="flex-1">
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-1">Service Address</p>
                  <p className="text-body-small text-charcoal-600 dark:text-white font-semibold">
                    {booking.address.street}
                  </p>
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                    {booking.address.city}, {booking.address.region}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          {booking.quotedPrice && (
            <div className="bg-white dark:bg-charcoal-500 rounded-xl p-4 border border-grey-stroke dark:border-charcoal-400">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={20} className="text-sage-600 dark:text-sage-400" weight="bold" />
                </div>
                <div className="flex-1">
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-1">Estimated Price</p>
                  <p className="text-body-medium text-charcoal-600 dark:text-white font-bold">
                    BHD {Number(booking.quotedPrice).toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-label-small text-blue-700 dark:text-blue-400 mb-1 font-semibold">Your Notes</p>
              <p className="text-body-small text-blue-900 dark:text-blue-100">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Booking ID */}
          <div className="text-center">
            <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
              Booking ID: <span className="font-mono font-semibold">#{booking.id}</span>
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-charcoal-500 border-t-2 border-grey-stroke dark:border-charcoal-400 p-4 flex gap-3">
          <button
            onClick={handleCancelClick}
            disabled={cancelling}
            className="flex-1 px-6 py-3 bg-error-bg text-error-text border-2 border-error-border font-bold rounded-xl hover:bg-error-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <XCircle size={20} weight="bold" />
            Cancel Booking
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-grey-200 dark:bg-charcoal-400 text-charcoal-600 dark:text-white font-bold rounded-xl hover:bg-grey-300 dark:hover:bg-charcoal-300 transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-10">
          <div className="bg-white dark:bg-charcoal-500 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-400">
              <h3 className="text-card-h2 text-charcoal-600 dark:text-white font-bold">
                Cancel Booking?
              </h3>
              <p className="text-body-small text-charcoal-400 dark:text-charcoal-300 mt-2">
                Please provide a reason for cancellation
              </p>
            </div>

            <div className="p-6">
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="E.g., Changed my mind, Found another provider, etc."
                className="w-full h-24 border-2 border-grey-stroke dark:border-charcoal-400 dark:bg-charcoal-600 dark:text-white rounded-xl p-3 text-body-small resize-none focus:border-sage-500 focus:outline-none"
                maxLength={200}
                autoFocus
              />
              <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-2">
                {cancellationReason.length}/200 characters
              </p>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 bg-grey-200 dark:bg-charcoal-400 text-charcoal-600 dark:text-white font-bold rounded-xl hover:bg-grey-300 dark:hover:bg-charcoal-300 transition-all"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancellationReason.trim() || cancelling}
                className="flex-1 px-4 py-2 bg-error-bg text-error-text border-2 border-error-border font-bold rounded-xl hover:bg-error-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
