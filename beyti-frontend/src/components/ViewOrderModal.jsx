import { X, Package, MapPin, CreditCard, Calendar } from '@phosphor-icons/react';
import Button from './Button';
import StatusChip from './StatusChip';

export default function ViewOrderModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
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
    const s = status?.toLowerCase();
    if (!s) return 'neutral';
    if (['placed', 'pending'].includes(s)) return 'warning';
    if (['accepted', 'preparing', 'ready for pickup', 'processing'].includes(s)) return 'brand';
    if (s === 'completed') return 'success';
    if (s === 'cancelled') return 'error';
    return 'neutral';
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 dark:bg-charcoal-600 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-cream-50 dark:bg-charcoal-600 border-b border-grey-stroke dark:border-charcoal-400 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
              <Package size={24} className="text-sage-600 dark:text-sage-400" />
            </div>
            <div>
              <h2 className="text-display-h3 text-charcoal-600 dark:text-cream-50">Order Details</h2>
              <p className="text-body-small text-charcoal-400 dark:text-charcoal-300">Order #{order.id}</p>
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
          {/* Status and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={20} className="text-charcoal-400 dark:text-charcoal-300" />
                <span className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Order Date</span>
              </div>
              <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={20} className="text-charcoal-400 dark:text-charcoal-300" />
                <span className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Status</span>
              </div>
              <StatusChip variant={getStatusVariant(order.status)}>
                {order.status}
              </StatusChip>
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-3">Seller Information</h3>
            <p className="text-body-regular text-charcoal-600 dark:text-cream-50">
              {order.sellerName || 'N/A'}
            </p>
          </div>

          {/* Order Items */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-4">Order Items</h3>
            {order.orderItems && order.orderItems.length > 0 ? (
              <div className="space-y-3">
                {order.orderItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between p-3 bg-cream-50 dark:bg-charcoal-600 rounded-lg">
                    <div className="flex-1">
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                        {item.productName || 'Product'}
                      </p>
                      <p className="text-body-small text-charcoal-400 dark:text-charcoal-300">
                        Quantity: {item.qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-body-small text-charcoal-400 dark:text-charcoal-300">
                        per item
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-regular text-charcoal-400 dark:text-charcoal-300">No items</p>
            )}
          </div>

          {/* Fulfillment Details */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={20} className="text-charcoal-400 dark:text-charcoal-300" />
              <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50">Fulfillment</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Type:</span>
                <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                  {order.fulfillmentType || 'N/A'}
                </span>
              </div>
              {order.deliveryAddress && (
                <div className="flex justify-between">
                  <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Address:</span>
                  <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium text-right max-w-xs">
                    {order.deliveryAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={20} className="text-charcoal-400 dark:text-charcoal-300" />
              <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50">Payment</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Method:</span>
                <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                  {order.paymentMethod || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Status:</span>
                <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">
                  {order.paymentStatus || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-grey-stroke dark:border-charcoal-400">
                <span className="text-body-large text-charcoal-600 dark:text-cream-50 font-semibold">Total Amount:</span>
                <span className="text-body-large text-sage-600 dark:text-sage-400 font-semibold">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-cream-50 dark:bg-charcoal-600 border-t border-grey-stroke dark:border-charcoal-400 p-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
