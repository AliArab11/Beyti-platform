/**
 * Customer History Page
 *
 * Displays customer's order and service booking history
 * Shows pending, in-progress, and completed transactions
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Scissors, ShoppingCart, Calendar } from '@phosphor-icons/react';
import CustomerSidebar from '../../components/CustomerSidebar';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import { getUserProfile, updateUserProfile, getCustomerOrders, getServiceBookings } from '../../services/api';
import { isAuthenticated, getUserId, handleSuspensionError } from '../../utils/authUtils';

export default function CustomerHistory() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Customer");
  const [userProfile, setUserProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'orders', 'services'
  const [viewMode, setViewMode] = useState('orders'); // 'orders', 'services'

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Get user ID from localStorage
  const userProfileId = parseInt(getUserId()) || 1002;
  const customerId = 2; // TODO: Get from API based on userProfileId

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile(userProfileId);
      if (profile) {
        const normalizedProfile = {
          userProfileId: profile.UserProfileId,
          displayName: profile.DisplayName,
          roleType: profile.RoleType,
          accountStatus: profile.AccountStatus,
          phone: profile.Phone,
          street: profile.Street,
          city: profile.City,
          region: profile.Region,
          postalCode: profile.PostalCode,
          country: profile.Country,
          address: profile.Address,
          createdAt: profile.CreatedAt,
          updatedAt: profile.UpdatedAt,
        };

        // Check if account is suspended
        if (normalizedProfile.accountStatus === 'Suspended') {
          navigate('/account-suspended');
          return;
        }

        setUserProfile(normalizedProfile);
        if (normalizedProfile.displayName) {
          setDisplayName(normalizedProfile.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (!handleSuspensionError(error, navigate)) {
        console.error('Failed to load profile');
      }
    }
  };

  // Fetch orders and service bookings
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [ordersData, bookingsData] = await Promise.all([
        getCustomerOrders(customerId),
        getServiceBookings(null, customerId)
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setServiceBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setOrders([]);
      setServiceBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updates) => {
    try {
      await updateUserProfile(userProfileId, 'Customer', updates);
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchHistory();
  }, [userProfileId, customerId]);

  // Handle sidebar navigation
  const handleNavigate = (view) => {
    switch(view) {
      case 'stores':
        navigate('/mainStore');
        break;
      case 'services':
        navigate('/serviceProviders');
        break;
      case 'notifications':
        navigate('/customer/notifications');
        break;
      case 'history':
        // Stay on current page
        break;
      default:
        break;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'BHD 0.000';
    return `BHD ${Number(amount).toFixed(3)}`;
  };

  // Get status variant for orders
  const getOrderStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (!s) return 'neutral';
    if (['placed', 'pending'].includes(s)) return 'warning';
    if (['accepted', 'preparing', 'ready for pickup', 'processing'].includes(s)) return 'brand';
    if (s === 'completed') return 'success';
    if (s === 'cancelled') return 'error';
    return 'neutral';
  };

  // Get status variant for service bookings
  const getBookingStatusVariant = (status) => {
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

  // Calculate metrics
  const metrics = useMemo(() => {
    const pendingOrders = orders.filter(o =>
      ['placed', 'pending', 'accepted', 'preparing', 'ready for pickup', 'processing'].includes(o.status?.toLowerCase())
    ).length;

    const pendingBookings = serviceBookings.filter(b =>
      ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'].includes(b.status)
    ).length;

    return {
      totalOrders: orders.length,
      totalBookings: serviceBookings.length,
      pendingOrders,
      pendingBookings,
      completedOrders: orders.filter(o => o.status?.toLowerCase() === 'completed').length,
      completedBookings: serviceBookings.filter(b => b.status === 'Completed').length,
    };
  }, [orders, serviceBookings]);

  // Filter data based on active tab and view mode
  const filteredData = useMemo(() => {
    let filteredOrders = orders;
    let filteredBookings = serviceBookings;

    if (activeTab === 'pending') {
      filteredOrders = orders.filter(o =>
        ['placed', 'pending', 'accepted', 'preparing', 'ready for pickup', 'processing'].includes(o.status?.toLowerCase())
      );
      filteredBookings = serviceBookings.filter(b =>
        ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'].includes(b.status)
      );
    }

    if (viewMode === 'orders') {
      return { orders: filteredOrders, bookings: [] };
    } else if (viewMode === 'services') {
      return { orders: [], bookings: filteredBookings };
    } else {
      return { orders: filteredOrders, bookings: filteredBookings };
    }
  }, [orders, serviceBookings, activeTab, viewMode]);

  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-charcoal-600">
      {/* Sidebar */}
      <CustomerSidebar
        currentPage="history"
        onNavigate={handleNavigate}
        userName={displayName}
        userRole="Customer"
      />

      {/* Main Content */}
      <div className="flex-1 ml-[250px] flex flex-col">
        {/* Header */}
        <PageHeader
          title="Orders & Services History"
          withSearch={false}
          notificationCount={0}
          userName={displayName}
          userRole="Customer"
          userProfile={userProfile}
          entityId={customerId}
          userId={userProfileId}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Total Orders</p>
                    <p className="text-display-h2 text-charcoal-600 dark:text-cream-50 mt-2">{metrics.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={24} className="text-sage-600 dark:text-sage-400" />
                  </div>
                </div>
              </div>

              <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Total Services</p>
                    <p className="text-display-h2 text-charcoal-600 dark:text-cream-50 mt-2">{metrics.totalBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
                    <Scissors size={24} className="text-sage-600 dark:text-sage-400" />
                  </div>
                </div>
              </div>

              <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Pending Items</p>
                    <p className="text-display-h2 text-sage-600 dark:text-sage-400 mt-2">
                      {metrics.pendingOrders + metrics.pendingBookings}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-sage-100 dark:bg-sage-900/30 rounded-lg flex items-center justify-center">
                    <Calendar size={24} className="text-sage-600 dark:text-sage-400" />
                  </div>
                </div>
              </div>

              <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300">Completed</p>
                    <p className="text-display-h2 text-charcoal-600 dark:text-cream-50 mt-2">
                      {metrics.completedOrders + metrics.completedBookings}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-charcoal-100 dark:bg-charcoal-500 rounded-lg flex items-center justify-center">
                    <Package size={24} className="text-charcoal-500 dark:text-charcoal-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* View Mode and Filter Tabs */}
            <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('orders')}
                    className={`px-6 py-3 rounded-md text-body-regular transition-colors ${
                      viewMode === 'orders'
                        ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                        : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
                    }`}
                  >
                    <ShoppingCart size={18} className="inline mr-2" />
                    Orders ({metrics.totalOrders})
                  </button>
                  <button
                    onClick={() => setViewMode('services')}
                    className={`px-6 py-3 rounded-md text-body-regular transition-colors ${
                      viewMode === 'services'
                        ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                        : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
                    }`}
                  >
                    <Scissors size={18} className="inline mr-2" />
                    Services ({metrics.totalBookings})
                  </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-md text-body-regular transition-colors ${
                      activeTab === 'all'
                        ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                        : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-md text-body-regular transition-colors ${
                      activeTab === 'pending'
                        ? 'bg-sage-500 text-cream-50 dark:bg-sage-700'
                        : 'bg-grey-200 dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 hover:bg-grey-300 dark:hover:bg-charcoal-400'
                    }`}
                  >
                    Pending ({metrics.pendingOrders + metrics.pendingBookings})
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-grey-stroke border-t-sage-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Orders List */}
                {viewMode === 'orders' && (
                  <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-grey-stroke dark:border-charcoal-400">
                      <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50">
                        Your Orders ({filteredData.orders.length})
                      </h3>
                    </div>
                    {filteredData.orders.length === 0 ? (
                      <div className="p-12 text-center text-charcoal-400 dark:text-charcoal-300">
                        No orders found
                      </div>
                    ) : (
                      <div className="divide-y divide-grey-stroke dark:divide-charcoal-400">
                        {filteredData.orders.map((order) => (
                          <div key={order.id} className="p-6 hover:bg-cream-100 dark:hover:bg-charcoal-500 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-body-regular font-semibold text-charcoal-600 dark:text-cream-50">
                                  Order #{order.id}
                                </h4>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-1">
                                  {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                                </p>
                              </div>
                              <StatusChip variant={getOrderStatusVariant(order.status)}>
                                {order.status}
                              </StatusChip>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-body-regular">
                              <div>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Seller</p>
                                <p className="text-charcoal-600 dark:text-cream-50">{order.sellerName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Total Amount</p>
                                <p className="text-charcoal-600 dark:text-cream-50 font-semibold">
                                  {formatCurrency(order.totalAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Fulfillment</p>
                                <p className="text-charcoal-600 dark:text-cream-50">{order.fulfillmentType || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Payment</p>
                                <p className="text-charcoal-600 dark:text-cream-50">
                                  {order.paymentMethod || 'N/A'} - {order.paymentStatus || 'N/A'}
                                </p>
                              </div>
                            </div>
                            {/* Order Items */}
                            {order.orderItems && order.orderItems.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-grey-stroke dark:border-charcoal-400">
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mb-2">Order Items:</p>
                                <div className="space-y-2">
                                  {order.orderItems.map((item, idx) => (
                                    <div key={item.id || idx} className="flex items-center justify-between text-body-small">
                                      <div className="flex-1">
                                        <p className="text-charcoal-600 dark:text-cream-50">
                                          {item.productName || 'Product'}
                                          {item.variantSKU && <span className="text-charcoal-400 dark:text-charcoal-300"> (SKU: {item.variantSKU})</span>}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <p className="text-charcoal-400 dark:text-charcoal-300">Qty: {item.qty}</p>
                                        <p className="text-charcoal-600 dark:text-cream-50 font-medium min-w-[80px] text-right">
                                          {formatCurrency(item.lineTotal)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Service Bookings List */}
                {viewMode === 'services' && (
                  <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-grey-stroke dark:border-charcoal-400">
                      <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50">
                        Your Service Bookings ({filteredData.bookings.length})
                      </h3>
                    </div>
                    {filteredData.bookings.length === 0 ? (
                      <div className="p-12 text-center text-charcoal-400 dark:text-charcoal-300">
                        No service bookings found
                      </div>
                    ) : (
                      <div className="divide-y divide-grey-stroke dark:divide-charcoal-400">
                        {filteredData.bookings.map((booking) => (
                          <div key={booking.id} className="p-6 hover:bg-cream-100 dark:hover:bg-charcoal-500 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-body-regular font-semibold text-charcoal-600 dark:text-cream-50">
                                  Booking #{booking.id}
                                </h4>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-1">
                                  {formatDate(booking.serviceDate)} at {booking.serviceTime || 'Time TBD'}
                                </p>
                              </div>
                              <StatusChip variant={getBookingStatusVariant(booking.status)}>
                                {booking.status}
                              </StatusChip>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-body-regular">
                              <div>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Provider</p>
                                <p className="text-charcoal-600 dark:text-cream-50">
                                  {booking.businessName || booking.providerName || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Service</p>
                                <p className="text-charcoal-600 dark:text-cream-50">{booking.serviceName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Service Type</p>
                                <p className="text-charcoal-600 dark:text-cream-50">{booking.serviceType || 'N/A'}</p>
                              </div>
                              {booking.quotedPrice != null && (
                                <div>
                                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Quoted Price</p>
                                  <p className="text-charcoal-600 dark:text-cream-50 font-semibold">
                                    {formatCurrency(booking.quotedPrice)}
                                  </p>
                                </div>
                              )}
                              {booking.depositAmount != null && (
                                <div>
                                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Deposit Paid</p>
                                  <p className="text-charcoal-600 dark:text-cream-50">
                                    {formatCurrency(booking.depositAmount)}
                                  </p>
                                </div>
                              )}
                              {booking.finalAmount != null && (
                                <div>
                                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Final Amount</p>
                                  <p className="text-charcoal-600 dark:text-cream-50 font-semibold">
                                    {formatCurrency(booking.finalAmount)}
                                  </p>
                                </div>
                              )}
                            </div>
                            {booking.notes && (
                              <div className="mt-4 pt-4 border-t border-grey-stroke dark:border-charcoal-400">
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">Notes</p>
                                <p className="text-body-regular text-charcoal-600 dark:text-cream-50 mt-1">
                                  {booking.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
