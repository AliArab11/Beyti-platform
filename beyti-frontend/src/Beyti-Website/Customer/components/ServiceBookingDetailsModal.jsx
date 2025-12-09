/**
 * Service Booking Details Modal Component
 *
 * Modal to display full service booking details
 */

import { X, Scissors, Calendar, CreditCard, User, Clock, FileText } from '@phosphor-icons/react';
import StatusChip from '../../../components/StatusChip';

export default function ServiceBookingDetailsModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
      case 'Rejected':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-cream-50 dark:bg-charcoal-600 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-grey-stroke dark:border-charcoal-400">
          <div>
            <h2 className="text-card-h2 text-charcoal-600 dark:text-cream-50">
              Service Booking Details
            </h2>
            <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-1">
              Booking #{booking.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-grey-200 dark:hover:bg-charcoal-500 rounded-md transition-colors"
          >
            <X size={24} className="text-charcoal-600 dark:text-cream-50" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Service Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
              <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-2">Status</p>
              <StatusChip variant={getStatusVariant(booking.status)}>
                {booking.status}
              </StatusChip>
            </div>
            <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
              <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Service Date
              </p>
              <p className="text-body-regular text-charcoal-600 dark:text-cream-50">
                {formatDate(booking.serviceDate)}
              </p>
              {booking.serviceTime && (
                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-1">
                  <Clock size={14} className="inline mr-1" />
                  {booking.serviceTime}
                </p>
              )}
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
            <h3 className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-3 flex items-center">
              <Scissors size={16} className="mr-1" />
              Service Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Service Name</p>
                <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold mt-1">
                  {booking.serviceName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Service Type</p>
                <p className="text-body-regular text-charcoal-600 dark:text-cream-50 mt-1">
                  {booking.serviceType || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
            <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-2 flex items-center">
              <User size={16} className="mr-1" />
              Service Provider
            </p>
            <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold">
              {booking.businessName || booking.providerName || 'N/A'}
            </p>
          </div>

          {/* Pricing Information */}
          <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
            <h3 className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-3 flex items-center">
              <CreditCard size={16} className="mr-1" />
              Pricing Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {booking.quotedPrice != null && (
                <div>
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Quoted Price</p>
                  <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold mt-1">
                    {formatCurrency(booking.quotedPrice)}
                  </p>
                </div>
              )}
              {booking.depositAmount != null && (
                <div>
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Deposit Paid</p>
                  <p className="text-body-regular text-charcoal-600 dark:text-cream-50 mt-1">
                    {formatCurrency(booking.depositAmount)}
                  </p>
                </div>
              )}
              {booking.finalAmount != null && (
                <div>
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Final Amount</p>
                  <p className="text-card-h3 text-sage-600 dark:text-sage-400 mt-1 font-semibold">
                    {formatCurrency(booking.finalAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
            <h3 className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-3">Timeline</h3>
            <div className="space-y-2">
              {booking.createdAt && (
                <div className="flex items-center justify-between text-body-small">
                  <span className="text-charcoal-400 dark:text-charcoal-300">Booking Created</span>
                  <span className="text-charcoal-600 dark:text-cream-50">{formatDateTime(booking.createdAt)}</span>
                </div>
              )}
              {booking.confirmedAt && (
                <div className="flex items-center justify-between text-body-small">
                  <span className="text-charcoal-400 dark:text-charcoal-300">Confirmed</span>
                  <span className="text-charcoal-600 dark:text-cream-50">{formatDateTime(booking.confirmedAt)}</span>
                </div>
              )}
              {booking.completedAt && (
                <div className="flex items-center justify-between text-body-small">
                  <span className="text-charcoal-400 dark:text-charcoal-300">Completed</span>
                  <span className="text-charcoal-600 dark:text-cream-50">{formatDateTime(booking.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
              <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-2 flex items-center">
                <FileText size={16} className="mr-1" />
                Notes
              </p>
              <p className="text-body-regular text-charcoal-600 dark:text-cream-50 whitespace-pre-wrap">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Additional Details */}
          {(booking.location || booking.estimatedDuration) && (
            <div className="bg-grey-100 dark:bg-charcoal-500 p-4 rounded-lg">
              <h3 className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-3">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.location && (
                  <div>
                    <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Location</p>
                    <p className="text-body-regular text-charcoal-600 dark:text-cream-50 mt-1">
                      {booking.location}
                    </p>
                  </div>
                )}
                {booking.estimatedDuration && (
                  <div>
                    <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Estimated Duration</p>
                    <p className="text-body-regular text-charcoal-600 dark:text-cream-50 mt-1">
                      {booking.estimatedDuration}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-grey-stroke dark:border-charcoal-400">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-sage-500 text-cream-50 rounded-md text-body-regular hover:bg-sage-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
