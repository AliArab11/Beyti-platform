import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as Icon from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarCheck, Bell, PackageIcon, ScissorsIcon, ShoppingCartIcon, CalendarIcon, ChatCircleTextIcon, CheckCircle, Circle } from "@phosphor-icons/react";
import PageHeader from "../../components/PageHeader";
import NavigationButton from "../../components/NavigationButton";
import AnalyticsCard from "../../components/AnalyticsCard";
import StatusChip from "../../components/StatusChip";
import CRUDButton from "../../components/CRUDButton";
import { Table, TableHeader, TableBody, TableRow } from "../../components/Table";
import '../Seller/Components/modalAnimations.css';
import OrderDetails from '../Store/Components/OrderDetails';
import Snackbar from '../../components/Snackbar';
import ProfilePage from '../../components/ProfilePage';
import ViewOrderModal from '../../components/ViewOrderModal';
import ViewServiceBookingModal from '../../components/ViewServiceBookingModal';
import ServiceReviewModal from '../../components/ServiceReviewModal';
import BookingTimer from '../../components/BookingTimer';
import NotificationsPage from '../ServiceProvider/components/NotificationsPage';

import {
  createReview,
  deleteReview,
  getServiceBookings,
  createServiceReview,
  getCustomerServiceReviews,
  cancelServiceBooking,
} from "../../services/api";
import { useSignalRNotifications } from '../../hooks/useSignalRNotifications';
import { useSignalR } from '../../contexts/SignalRContext';

// API helpers
const BASE_URL = "https://localhost:7062/api";

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = { "Content-Type": "application/json" };
    const config = {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers || {}) },
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error;
  }
};

const getCustomers = async () => fetchAPI("/Customers");
const getCustomerOrders = async (customerId) => 
  fetchAPI(`/Orders?customerId=${customerId}`);

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
    // No timeZone = uses user's local timezone
  });
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return "BHD 0.000";
  return `BHD ${Number(value).toFixed(3)}`;
};

const getStatusVariant = (status) => {
  const s = status?.toLowerCase();
  if (!s) return "neutral";
  if (s === "placed" || s === "pending") return "danger";
  if (["accepted", "preparing", "ready for pickup"].includes(s)) return "brand";
  if (s === "completed" || s === "delivered") return "success";
  if (s === "cancelled") return "error";
  return "neutral";
};

// Order Details Modal
const OrderDetailsModal = ({ order, onClose, onReorder, openReviewModal, onDeleteReview }) => {
  if (!order) return null;

  // Log when order prop changes (indicates SignalR update)
  React.useEffect(() => {
    console.log('[OrderDetailsModal] Received order update:', {
      id: order.id,
      status: order.status,
      fullOrder: order
    });
  }, [order]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm modal-backdrop-enter">
      <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-grey-stroke modal-content-enter">
        {/* Header */}
        <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-charcoal-700">
              Order #{order.id}
            </h2>
            <p className="text-sm text-charcoal-400">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-charcoal-400 hover:text-charcoal-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                Order Status
              </p>
              <StatusChip variant={getStatusVariant(order.status)}>
                {order.status || "Unknown"}
              </StatusChip>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-charcoal-400 uppercase tracking-wide">
                Fulfillment
              </p>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-grey-200 text-charcoal-600">
                {order.fulfillmentType || "N/A"}
              </span>
            </div>
          </div>

          {/* Store & Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-grey-100 rounded-xl p-4 border border-grey-stroke">
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Store
              </p>
              <p className="text-sm font-semibold text-charcoal-700">
                {order.sellerName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 mb-1 uppercase tracking-wide">
                Order Total
              </p>
              <p className="text-lg font-semibold text-charcoal-800">
                {formatCurrency(order.totalAmount || 0)}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-charcoal-700">
              Order Items ({order.orderItems?.length || 0})
            </h3>
            {order.orderItems && order.orderItems.length > 0 ? (
              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="bg-cream-50 border border-grey-stroke rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-charcoal-700">
                          {item.productName || "Product"}
                        </p>
                        <p className="text-xs text-charcoal-400">
                          Qty: {item.qty}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-charcoal-800">
                        {formatCurrency(item.lineTotal || 0)}
                      </p>
                    </div>
                    
                    {/* Review Section */}
                    {['completed', 'delivered'].includes(order.status?.toLowerCase()) && (
                      <div className="pt-2 border-t border-grey-stroke">
                        {!item.review ? (
                          <button
                            onClick={() => openReviewModal(order.id, item.productId, item.productName)}
                            className="text-xs bg-sage-500 hover:bg-sage-600 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                          >
                            ⭐ Write Review
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span key={star} className={`text-sm ${star <= item.review.rating ? 'text-yellow-400' : 'text-grey-stroke'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={() => onDeleteReview(item.review.id)}
                                className="text-xs text-error-btn hover:text-error-text font-medium"
                              >
                                Delete
                              </button>
                            </div>
                            <p className="text-xs text-charcoal-600 italic">"{item.review.comment}"</p>
                            <p className="text-xs text-charcoal-400">
                              {formatDate(item.review.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-400">No items found.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-grey-stroke bg-grey-100 flex gap-3">
        <button
          type="button"
          onClick={() => onReorder(order)}
          className="flex-1 bg-sage-500 hover:bg-sage-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <Icon.ShoppingCart size={20} weight="bold" />
          Reorder
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
        >
          Close
        </button>
      </div>
      </div>
    </div>
  );
};

// Main Customer Dashboard
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get customer info from session storage (set by MainStoreView/StoreView)
  const [customerId, setCustomerId] = useState(() => {
    return parseInt(sessionStorage.getItem('beyti_customerId')) || null;
  });
  const [customerName, setCustomerName] = useState(() => {
    return sessionStorage.getItem('beyti_customerName') || "My Account";
  });
  const [userProfileId, setUserProfileId] = useState(() => {
    return parseInt(sessionStorage.getItem('beyti_userProfileId')) || 1; // Hardcoded fallback for testing
  });

  const [customerList, setCustomerList] = useState([]);
  const [selectModalOpen, setSelectModalOpen] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const [activeOrder, setActiveOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);  
  
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

  const showSnackbar = useCallback((message, type = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 5000);
  }, []);

  const [showReorderModal, setShowReorderModal] = useState(false);
  const [pendingReorderItems, setPendingReorderItems] = useState(null);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const [mainTab, setMainTab] = useState('orders'); // Main navigation: orders or services
  const [activeTab, setActiveTab] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');

  // Service bookings filters
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('all');
  const [serviceSortBy, setServiceSortBy] = useState('date-desc');

  // Review modal state
const [reviewModal, setReviewModal] = useState({
  show: false,
  orderId: null,
  productId: null,
  productName: "",
  rating: 5,
  comment: "",
  loading: false,
  error: null
});

  // History page state
  const [serviceBookings, setServiceBookings] = useState([]);
  const [serviceReviews, setServiceReviews] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState('all');
  const [historyViewMode, setHistoryViewMode] = useState('orders');
  const [viewOrderModal, setViewOrderModal] = useState({ isOpen: false, order: null });
  const [viewBookingModal, setViewBookingModal] = useState({ isOpen: false, booking: null });
  const [serviceReviewModal, setServiceReviewModal] = useState({ isOpen: false, booking: null });
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelBookingData, setCancelBookingData] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Notifications state
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('');

  // SignalR connection
  const { startConnection, isConnected, on, off } = useSignalR();

  // Initialize SignalR connection when userProfileId is available
  useEffect(() => {
    console.log('[CustomerDashboard] SignalR connection check - userProfileId:', userProfileId, 'isConnected:', isConnected);
    if (userProfileId && !isConnected) {
      console.log('[CustomerDashboard] Starting SignalR connection for user:', userProfileId);
      startConnection(userProfileId);
    } else if (!userProfileId) {
      console.warn('[CustomerDashboard] Cannot start SignalR - no userProfileId!');
    } else if (isConnected) {
      console.log('[CustomerDashboard] SignalR already connected for userProfileId:', userProfileId);
    }
  }, [userProfileId, isConnected, startConnection]);

  // DEBUG: Direct listener to test if event is received at all
  useEffect(() => {
    if (!isConnected) return;

    const debugHandler = (data) => {
      console.log('🔥🔥🔥 [CustomerDashboard] DIRECT receivebookingstatuschange event received:', data);
    };

    on('receivebookingstatuschange', debugHandler);
    console.log('🔍 [CustomerDashboard] Direct debug handler registered for receivebookingstatuschange');

    return () => {
      off('receivebookingstatuschange', debugHandler);
      console.log('🔍 [CustomerDashboard] Direct debug handler unregistered');
    };
  }, [isConnected, on, off]);

  // Cart state - load from localStorage
const [cart, setCart] = useState(() => {
  try {
    if (customerId) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
          const savedCart = localStorage.getItem(key);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart.length > 0) {
              return parsedCart;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading cart:', err);
  }
  return [];
});

// Poll cart updates
useEffect(() => {
  if (!customerId) {
    setCart([]);
    return;
  }

  const updateCart = () => {
    try {
      let allItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
          const savedCart = localStorage.getItem(key);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart.length > 0) {
              allItems = parsedCart;
              break;
            }
          }
        }
      }
      setCart(allItems);
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  updateCart();
  const interval = setInterval(updateCart, 500);
  return () => clearInterval(interval);
}, [customerId]);

  // Disable body scroll when modals are open
  useEffect(() => {
    if (selectModalOpen || orderModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectModalOpen, orderModalOpen]);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomerList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
    };
    loadCustomers();
  }, []);

// Fetch orders with reviews
const fetchOrders = useCallback(async () => {
  if (!customerId) return;

  try {
    setLoading(true);
    setError(null);
    const data = await getCustomerOrders(customerId);

    console.log('🔍 RAW ORDER DATA FROM BACKEND:', JSON.stringify(data, null, 2));

    // Fetch reviews for all products in all orders
    const ordersWithReviews = await Promise.all(
      (data || []).map(async (order) => {
        console.log(`📦 Processing order #${order.id} - Status: ${order.status}`);

        const itemsWithReviews = await Promise.all(
          (order.orderItems || []).map(async (item) => {
            try {
              const response = await fetch(`https://localhost:7062/api/Reviews?productId=${item.productId}&customerId=${customerId}`);
              const reviewData = await response.json();
              const orderReview = reviewData.find(r => r.orderId === order.id && r.productId === item.productId);
              return { ...item, review: orderReview || null };
            } catch {
              return { ...item, review: null };
            }
          })
        );
        return { ...order, orderItems: itemsWithReviews };
      })
    );

    console.log('✅ FINAL ORDERS WITH REVIEWS:', JSON.stringify(ordersWithReviews, null, 2));
    setOrders(ordersWithReviews);
  } catch (err) {
    setError(err.message || "Failed to load orders");
  } finally {
    setLoading(false);
  }
}, [customerId]);

 // Load orders with reviews - only on mount or when customerId changes
useEffect(() => {
  if (!customerId) return;

  // Only load if we don't have orders yet
  if (orders.length > 0) return;

  fetchOrders();
}, [customerId, fetchOrders]); // Added fetchOrders to dependencies

// Fetch history data (services and reviews)
const fetchHistory = useCallback(async () => {
  try {
    setHistoryLoading(true);
    console.log('🔍 Fetching service bookings for customer ID:', customerId);
    const [bookingsData, reviewsData] = await Promise.all([
      getServiceBookings(null, customerId),
      getCustomerServiceReviews(customerId)
    ]);

    console.log('📦 Raw bookings data:', bookingsData);
    console.log('⭐ Raw reviews data:', reviewsData);

    const bookings = Array.isArray(bookingsData) ? bookingsData : [];
    console.log('✅ Processed bookings array:', bookings.length, 'items');
    setServiceBookings(bookings);

    // Enrich reviews with booking data
    const enrichedReviews = Array.isArray(reviewsData)
      ? reviewsData.map(review => {
          const booking = bookings.find(b => b.id === review.serviceBookingId);
          return {
            ...review,
            providerName: booking?.businessName || booking?.providerName || null,
            serviceName: booking?.serviceName || null
          };
        })
      : [];

    console.log('✅ Enriched reviews:', enrichedReviews.length, 'items');
    setServiceReviews(enrichedReviews);
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    setServiceBookings([]);
    setServiceReviews([]);
  } finally {
    setHistoryLoading(false);
  }
}, [customerId]);

// Load history data (services and reviews) for the main page
useEffect(() => {
  if (customerId) {
    fetchHistory();
  }
}, [customerId, fetchHistory]);

// Stabilize SignalR event handlers with useCallback to prevent re-registration
const handleBookingUpdate = useCallback((data) => {
  console.log('[CustomerDashboard] Received booking update:', data);

  if (data.type === 'BookingCreated') {
    // Customer's own booking created - refresh list
    fetchHistory();
    showSnackbar('Booking request submitted successfully!', 'success');
  }
}, [fetchHistory, showSnackbar]);

const handleBookingStatusChange = useCallback((data) => {
  console.log('[CustomerDashboard] Received booking status change:', data);
  console.log('[CustomerDashboard] Booking data from SignalR:', data.booking);

  // Update the booking in the list with complete booking data from backend
  setServiceBookings(prev => {
    const updated = prev.map(booking => {
      if (booking.id === data.bookingId) {
        // Use the complete booking data from backend, ensuring we preserve the id
        const updatedBooking = {
          ...data.booking,
          id: data.bookingId,
          status: data.newStatus
        };
        console.log('[CustomerDashboard] Updating booking from:', booking, 'to:', updatedBooking);
        return updatedBooking;
      }
      return booking;
    });
    console.log('[CustomerDashboard] Updated serviceBookings:', updated);
    return updated;
  });

  // Show notification about status change
  const statusMessages = {
    'Confirmed': 'Your booking has been confirmed!',
    'InProgress': 'Your service is now in progress',
    'Completed': 'Your service has been completed!',
    'Canceled': 'Your booking has been canceled',
    'Cancelled': 'Your booking has been cancelled',
    'Rejected': 'Your booking request was rejected'
  };

  const message = statusMessages[data.newStatus] || 'Booking status updated';
  const type = ['Rejected', 'Canceled', 'Cancelled'].includes(data.newStatus) ? 'error' : 'success';
  showSnackbar(message, type);
}, [showSnackbar]);

const handleOrderUpdate = useCallback((data) => {
  console.log('[CustomerDashboard] Received order update:', data);

  if (data.type === 'OrderCreated') {
    // Customer's own order created - refresh orders
    fetchOrders();
    showSnackbar('Order placed successfully!', 'success');
  }
}, [fetchOrders, showSnackbar]);

const handleOrderStatusChange = useCallback((data) => {
  console.log('[CustomerDashboard] Received order status change:', data);
  console.log('[CustomerDashboard] Order data from SignalR:', data.order);

  // Update the order in the list with complete order data from backend
  setOrders(prev => prev.map(order => {
    if (order.id === data.orderId) {
      // Use the complete order data from backend, ensuring we preserve the id
      const updatedOrder = {
        ...data.order,
        id: data.orderId,
        status: data.newStatus
      };
      console.log('[CustomerDashboard] Updating order from:', order, 'to:', updatedOrder);
      return updatedOrder;
    }
    return order;
  }));

  // Show notification about order status change
  const orderStatusMessages = {
    'Accepted': 'Your order has been accepted!',
    'Preparing': 'Your order is being prepared',
    'Ready for Pickup': 'Your order is ready for pickup!',
    'Completed': 'Your order has been completed!',
    'Cancelled': 'Your order has been cancelled'
  };

  const message = orderStatusMessages[data.newStatus] || 'Order status updated';
  const type = data.newStatus === 'Cancelled' ? 'error' : 'success';
  showSnackbar(message, type);
}, [showSnackbar]);

// Handle real-time announcements
const handleAnnouncement = useCallback((data) => {
  console.log('[CustomerDashboard] Received announcement:', data);
  showSnackbar(`📢 ${data.title}: ${data.message}`, 'success');
}, [showSnackbar]);

// Set up real-time booking and order updates via SignalR
useSignalRNotifications({
  onBookingUpdate: handleBookingUpdate,
  onBookingStatusChange: handleBookingStatusChange,
  onOrderUpdate: handleOrderUpdate,
  onOrderStatusChange: handleOrderStatusChange,
  onAnnouncement: handleAnnouncement
});

// Sync historyViewMode with mainTab
useEffect(() => {
  setHistoryViewMode(mainTab);
}, [mainTab]);



  // REPLACE the entire activeOrders useMemo with:
  const activeOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.filter(o => 
      !['completed', 'cancelled', 'delivered'].includes(o.status?.toLowerCase())
    );
  }, [orders]);

  const completedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.filter(o => 
      ['completed', 'delivered'].includes(o.status?.toLowerCase())
    );
  }, [orders]);

  const cancelledOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.filter(o => o.status?.toLowerCase() === 'cancelled');
  }, [orders]);

const displayedOrders = useMemo(() => {
  let ordersToDisplay = [];
  switch(activeTab) {
    case 'active': ordersToDisplay = activeOrders; break;
    case 'completed': ordersToDisplay = completedOrders; break;
    case 'cancelled': ordersToDisplay = cancelledOrders; break;
    default: ordersToDisplay = orders;
  }
  
  // Apply search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    ordersToDisplay = ordersToDisplay.filter(order => 
      order.id.toString().includes(query) ||
      (order.sellerName || '').toLowerCase().includes(query)
    );
  }
  // Apply fulfillment filter
  if (fulfillmentFilter !== 'all') {
    ordersToDisplay = ordersToDisplay.filter(order => 
      order.fulfillmentType?.toLowerCase() === fulfillmentFilter
    );
  }
  
  // Apply sort
  return [...ordersToDisplay].sort((a, b) => {
    switch(sortBy) {
      case 'date-asc': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'amount-desc': return (b.totalAmount || 0) - (a.totalAmount || 0);
      case 'amount-asc': return (a.totalAmount || 0) - (b.totalAmount || 0);
      default: return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
}, [activeTab, orders, activeOrders, completedOrders, cancelledOrders, searchQuery, sortBy, fulfillmentFilter]);

// Filter and sort service bookings
const displayedServiceBookings = useMemo(() => {
  let bookingsToDisplay = [...serviceBookings];

  // Apply status filter
  if (serviceStatusFilter !== 'all') {
    bookingsToDisplay = bookingsToDisplay.filter(booking => {
      const status = booking.status?.toLowerCase();
      switch(serviceStatusFilter) {
        case 'completed': return status === 'completed';
        case 'confirmed': return status === 'confirmed';
        case 'rejected': return status === 'rejected';
        case 'cancelled': return status === 'canceled' || status === 'cancelled';
        default: return true;
      }
    });
  }

  // Apply search
  if (serviceSearchQuery.trim()) {
    const query = serviceSearchQuery.toLowerCase();
    bookingsToDisplay = bookingsToDisplay.filter(booking =>
      booking.id?.toString().includes(query) ||
      booking.serviceName?.toLowerCase().includes(query) ||
      booking.businessName?.toLowerCase().includes(query) ||
      booking.providerName?.toLowerCase().includes(query) ||
      booking.serviceType?.toLowerCase().includes(query)
    );
  }

  // Apply sort
  return [...bookingsToDisplay].sort((a, b) => {
    switch(serviceSortBy) {
      case 'date-asc': return a.id - b.id; // Oldest (lowest ID first)
      case 'amount-desc': return (b.finalPrice || b.quotedPrice || 0) - (a.finalPrice || a.quotedPrice || 0);
      case 'amount-asc': return (a.finalPrice || a.quotedPrice || 0) - (b.finalPrice || b.quotedPrice || 0);
      default: return b.id - a.id; // Newest (highest ID first)
    }
  });
}, [serviceBookings, serviceSearchQuery, serviceStatusFilter, serviceSortBy]);

// Set the currently displayed active order based on index
const currentActiveOrder = activeOrders.length > 0 ? activeOrders[activeOrderIndex] : null;

const getPageTitle = () => {
  if (location.pathname === "/customer-dashboard" || location.pathname === "/customer-dashboard/" || location.pathname.includes("/customer-dashboard/bookings")) {
    return "My History";
  } else if (location.pathname.includes("/customer-dashboard/profile")) {
    return "My Profile";
  } else if (location.pathname.includes("/customer-dashboard/notifications")) {
    return "Notifications";
  } else {
    return "Dashboard";
  }
};

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setOrderModalOpen(false);
    setSelectedOrder(null);
  };

    const handleReorder = async (order) => {
  if (!order || !order.orderItems || order.orderItems.length === 0) {
    showSnackbar('No items to reorder', 'error');
    return;
  }

  try {
    // Check if there's any existing cart
    let hasExistingCart = false;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
        const savedCart = localStorage.getItem(key);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (parsedCart.length > 0) {
            hasExistingCart = true;
            break;
          }
        }
      }
    }

    // Create cart items from order
    const cartItems = order.orderItems.map(item => ({
      id: item.productId || item.id,
      name: item.productName,
      basePrice: item.unitPrice,
      quantity: item.qty,
      totalPrice: item.lineTotal,
      selectedVariant: item.productVariantId ? { id: item.productVariantId } : null,
      storeName: order.sellerName,
      sellerId: order.sellerId
    }));

    // Store pending reorder
    setPendingReorderItems({ items: cartItems, order });

    // ALWAYS show the clear cart modal, regardless of cart state
    setShowClearCartModal(true);

  } catch (err) {
    console.error('Error reordering:', err);
    showSnackbar('Failed to process reorder', 'error');
  }
};

  const confirmReorder = () => {
    if (!pendingReorderItems) return;

    const { items, order } = pendingReorderItems;
    const cartKey = `beyti_cart_${order.sellerId}_${customerId}`;
    
    // Check if there's an existing cart from the SAME store
    let existingCart = [];
    try {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        existingCart = JSON.parse(savedCart);
      }
    } catch (err) {
      console.error('Error reading cart:', err);
    }
    
    // If cart has items from same store, merge them
    if (existingCart.length > 0) {
      // Merge items: add quantities for matching items, add new items
      const mergedCart = [...existingCart];
      
      items.forEach(newItem => {
        const existingIndex = mergedCart.findIndex(cartItem => {
          const sameProduct = cartItem.id === newItem.id;
          const sameVariant = (!cartItem.selectedVariant && !newItem.selectedVariant) ||
                              (cartItem.selectedVariant?.id === newItem.selectedVariant?.id);
          return sameProduct && sameVariant;
        });
        
        if (existingIndex !== -1) {
          // Update quantity
          mergedCart[existingIndex].quantity += newItem.quantity;
          mergedCart[existingIndex].totalPrice = 
            mergedCart[existingIndex].basePrice * mergedCart[existingIndex].quantity;
        } else {
          // Add new item
          mergedCart.push(newItem);
        }
      });
      
      localStorage.setItem(cartKey, JSON.stringify(mergedCart));
    } else {
      // Empty cart - just add items
      localStorage.setItem(cartKey, JSON.stringify(items));
    }
    
    showSnackbar(`${items.length} item${items.length !== 1 ? 's' : ''} added to cart!`, 'success');
    setShowReorderModal(false);
    setPendingReorderItems(null);
    setOrderModalOpen(false);
  };

const confirmClearAndReorder = () => {
  if (!pendingReorderItems) {
    console.error('No pending items to reorder');
    return;
  }

  const { items, order } = pendingReorderItems;
  
  // Clear ALL existing carts for this customer
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
      localStorage.removeItem(key);
      console.log('Cleared cart:', key);
    }
  }
  
  // Add new cart with reordered items
  const cartKey = `beyti_cart_${order.sellerId}_${customerId}`;
  localStorage.setItem(cartKey, JSON.stringify(items));
  console.log('Added reorder to cart:', cartKey, items);
  
  showSnackbar(`Order #${order.id} items added to cart!`, 'success');
  setShowClearCartModal(false);
  setPendingReorderItems(null);
  setOrderModalOpen(false);
};

const cancelReorder = () => {
  setShowClearCartModal(false);
  setPendingReorderItems(null);
  showSnackbar('Reorder cancelled', 'warning');
};

// Review modal functions
const openReviewModal = (orderId, productId, productName) => {
  setReviewModal({ 
    show: true, 
    orderId, 
    productId,
    productName,
    rating: 5, 
    comment: "", 
    loading: false, 
    error: null 
  });
};

const closeReviewModal = () => {
  setReviewModal({ 
    show: false, 
    orderId: null, 
    productId: null,
    productName: "",
    rating: 5, 
    comment: "", 
    loading: false, 
    error: null 
  });
};

const handleSubmitProductReview = async () => {
  if (!reviewModal.comment.trim()) {
    setReviewModal(prev => ({ ...prev, error: "Please write a comment" }));
    showSnackbar("Please write a comment", 'error');
    return;
  }

  setReviewModal(prev => ({ ...prev, loading: true, error: null }));
  try {
    const newReview = await createReview({
      OrderId: reviewModal.orderId,
      ProductId: reviewModal.productId,
      CustomerId: customerId,
      Rating: reviewModal.rating,
      Comment: reviewModal.comment
    });

    // Optimistically update the UI immediately
    const updatedOrders = orders.map(order => {
      if (order.id === reviewModal.orderId) {
        return {
          ...order,
          orderItems: order.orderItems.map(item => {
            if (item.productId === reviewModal.productId) {
              return {
                ...item,
                review: {
                  id: newReview.id || Date.now(), // Use returned ID or temp ID
                  orderId: reviewModal.orderId,
                  productId: reviewModal.productId,
                  customerId: customerId,
                  rating: reviewModal.rating,
                  comment: reviewModal.comment,
                  createdAt: Date.now()
                }
              };
            }
            return item;
          })
        };
      }
      return order;
    });

    setOrders(updatedOrders);

    // Update selected order if modal is open
    if (orderModalOpen && selectedOrder && selectedOrder.id === reviewModal.orderId) {
      const updatedOrder = updatedOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }

    showSnackbar('Review submitted successfully! ⭐', 'success');
    closeReviewModal();


  } catch (err) {
    const errorMsg = err.message || "Failed to submit review";
    setReviewModal(prev => ({ ...prev, error: errorMsg, loading: false }));
    showSnackbar(errorMsg, 'error');
  }
};

const handleDeleteReview = async (reviewId) => {
  try {
    await deleteReview(reviewId);

    // Optimistically update the UI immediately
    const updatedOrders = orders.map(order => ({
      ...order,
      orderItems: order.orderItems.map(item => {
        if (item.review && item.review.id === reviewId) {
          return { ...item, review: null };
        }
        return item;
      })
    }));

    setOrders(updatedOrders);

    // Update selected order if modal is open
    if (orderModalOpen && selectedOrder) {
      const updatedOrder = updatedOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }

    showSnackbar('Review deleted successfully', 'success');
  } catch (err) {
    showSnackbar(err.message || 'Failed to delete review', 'error');
  }
};

// ============ History Page Functions ============

// Format time
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get status variant for orders (history version)
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
    case 'Cancelled':
    case 'Rejected':
      return 'error';
    default:
      return 'neutral';
  }
};

// Handler functions for history
const handleViewOrder = (order) => {
  setViewOrderModal({ isOpen: true, order });
};

const handleViewBooking = (booking) => {
  setViewBookingModal({ isOpen: true, booking });
};

const handleOpenReview = (booking) => {
  setServiceReviewModal({ isOpen: true, booking });
};

// Check if a booking already has a review
const bookingHasReview = (bookingId) => {
  return serviceReviews.some(review => review.serviceBookingId === bookingId);
};

const handleSubmitServiceReview = async (reviewData) => {
  try {
    await createServiceReview(reviewData);
    showSnackbar('Review submitted successfully!', 'success');
    await fetchHistory();
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

const handleCancelBookingClick = (booking) => {
  setCancelBookingData(booking);
  setShowCancelDialog(true);
};

const handleConfirmCancelBooking = async () => {
  if (!cancellationReason.trim()) {
    showSnackbar('Please provide a reason for cancellation', 'warning');
    return;
  }

  if (!cancelBookingData) return;

  try {
    setCancellingBookingId(cancelBookingData.id);
    await cancelServiceBooking(cancelBookingData.id, cancelBookingData, customerName, cancellationReason);
    showSnackbar('Booking cancelled successfully.', 'success');
    setShowCancelDialog(false);
    setCancellationReason('');
    setCancelBookingData(null);
    await fetchHistory();
  } catch (error) {
    console.error('Error cancelling booking:', error);
    showSnackbar('Failed to cancel booking. Please try again.', 'error');
  } finally {
    setCancellingBookingId(null);
  }
};

const handleTimerExpire = async (bookingId) => {
  try {
    console.log('Booking #' + bookingId + ' expired, auto-cancelling...');
    const booking = serviceBookings.find(b => b.id === bookingId);
    if (booking) {
      await cancelServiceBooking(bookingId, booking, 'System', 'No response from provider within time limit');
      await fetchHistory();
    }
  } catch (error) {
    console.error('Error auto-cancelling booking:', error);
  }
};

// Metrics (next section starts here)
const { metrics, recentOrders } = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        metrics: {
          totalOrders: 0,
          activeOrders: 0,
          totalSpent: 0,
        },
        recentOrders: [],
      };
    }

    const totalOrders = orders.length;
    const activeOrders = orders.filter(
      (o) => !["completed", "cancelled", "delivered"].includes(o.status?.toLowerCase())
    ).length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      metrics: { totalOrders, activeOrders, totalSpent },
      recentOrders,
    };
  }, [orders]);

  // Calculate favorite stores
const favoriteStores = useMemo(() => {
  if (!orders || orders.length === 0) return [];
  
  // Count orders per store
  const storeCounts = {};
  orders.forEach(order => {
    const storeName = order.sellerName || 'Unknown Store';
    storeCounts[storeName] = (storeCounts[storeName] || 0) + 1;
  });
  
  // Sort by count and get top 3
  return Object.entries(storeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}, [orders]);

// Separate past orders (completed/cancelled)
const pastOrders = useMemo(() => {
  return orders
    .filter(o => ['completed', 'cancelled', 'delivered'].includes(o.status?.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
}, [orders]);

// History page metrics
const historyMetrics = useMemo(() => {
  const pendingOrders = orders.filter(o =>
    ['placed', 'pending', 'accepted', 'preparing', 'ready for pickup', 'processing'].includes(o.status?.toLowerCase())
  ).length;

  const pendingBookings = serviceBookings.filter(b =>
    ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'].includes(b.status)
  ).length;

  const inProgressBookings = serviceBookings.filter(b =>
    !['Completed', 'Rejected', 'Canceled', 'Cancelled'].includes(b.status)
  );

  return {
    totalOrders: orders.length,
    totalBookings: serviceBookings.length,
    pendingOrders,
    pendingBookings,
    inProgressBookings,
    completedOrders: orders.filter(o => o.status?.toLowerCase() === 'completed').length,
    completedBookings: serviceBookings.filter(b => b.status === 'Completed').length,
  };
}, [orders, serviceBookings]);

// Filter data based on active tab and view mode for history
const historyFilteredData = useMemo(() => {
  let filteredOrders = orders;
  let filteredBookings = serviceBookings;

  console.log('🔧 historyFilteredData - Input:', {
    ordersCount: orders.length,
    bookingsCount: serviceBookings.length,
    historyActiveTab,
    historyViewMode
  });

  if (historyActiveTab === 'pending') {
    filteredOrders = orders.filter(o =>
      ['placed', 'pending', 'accepted', 'preparing', 'ready for pickup', 'processing'].includes(o.status?.toLowerCase())
    );
    filteredBookings = serviceBookings.filter(b =>
      ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'].includes(b.status)
    );
  }

  let result;
  if (historyViewMode === 'orders') {
    result = { orders: filteredOrders, bookings: [] };
  } else if (historyViewMode === 'services') {
    result = { orders: [], bookings: filteredBookings };
  } else {
    result = { orders: filteredOrders, bookings: filteredBookings };
  }

  console.log('✅ historyFilteredData - Output:', {
    ordersCount: result.orders.length,
    bookingsCount: result.bookings.length
  });

  return result;
}, [orders, serviceBookings, historyActiveTab, historyViewMode]);

  // Customer Select Modal
  const CustomerSelectModal = () => {
    if (!selectModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4 modal-backdrop-enter">
        <div className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-grey-stroke modal-content-enter">
          <h2 className="text-2xl font-semibold text-charcoal-700 mb-2">
            Select Customer Profile
          </h2>
          <p className="text-body-regular text-charcoal-400 mb-4">
            Choose your customer account to continue.
          </p>
          <select
            className="w-full border border-grey-stroke rounded-lg p-3 mb-6 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
            defaultValue=""
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              if (!id) return;
              const selected = customerList.find((c) => c.id === id);
              const name = selected?.fullName || "My Account";
              const profileId = selected?.userProfileId || selected?.UserProfileId;

              console.log("🔔 CustomerDashboard: Selected customer:", selected);
              console.log("🔔 CustomerDashboard: userProfileId:", profileId);

              setCustomerName(name);
              setCustomerId(id);
              setUserProfileId(profileId);
              setSelectModalOpen(false);

              // Save to sessionStorage
              sessionStorage.setItem('beyti_customerId', id.toString());
              sessionStorage.setItem('beyti_customerName', name);
              sessionStorage.setItem('beyti_userProfileId', profileId?.toString() || '');
            }}
          >
            <option value="">-- Select Customer --</option>
            {customerList.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName || `Customer #${customer.id}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSelectModalOpen(false)}
            className="w-full bg-error-btn hover:bg-error-btn/90 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <CustomerSelectModal />
      {orderModalOpen && selectedOrder && (
      <OrderDetailsModal 
        order={orders.find(o => o.id === selectedOrder.id) || selectedOrder}
        onClose={closeOrderModal}
        onReorder={handleReorder}
        openReviewModal={openReviewModal}
        onDeleteReview={handleDeleteReview}
      />
    )}

      {/* Sidebar */}
      <aside className="w-64 bg-sage-500 flex flex-col fixed h-screen border-r border-sage-700">
        <div className="p-6 border-b border-sage-700">
          <h1 className="text-display-h1 text-cream-200">Beyti</h1>
          <p className="text-label-medium text-cream-100 mt-1">Customer Portal</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/profile")}
            onClick={() => navigate("profile")}
            icon={<Icon.User size={20} weight={location.pathname.includes("/profile") ? "fill" : "regular"} />}
          >
            Profile
          </NavigationButton>

          <NavigationButton
            selected={location.pathname === "/customer-dashboard" || location.pathname === "/customer-dashboard/" || location.pathname.includes("/customer-dashboard/bookings")}
            onClick={() => navigate("/customer-dashboard")}
            icon={<Icon.CalendarCheck size={20} weight={(location.pathname === "/customer-dashboard" || location.pathname === "/customer-dashboard/" || location.pathname.includes("/bookings")) ? "fill" : "regular"} />}
          >
            My History
          </NavigationButton>

          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/notifications")}
            onClick={() => navigate("/customer-dashboard/notifications")}
            icon={<Icon.Bell size={20} weight={location.pathname.includes("/customer-dashboard/notifications") ? "fill" : "regular"} />}
          >
            Notifications
          </NavigationButton>
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col">
        <div className="border-b border-grey-stroke bg-grey-200">
        
      
          <div className="border-b border-grey-stroke bg-grey-200">
            <PageHeader
              title={getPageTitle()}
              notificationCount={metrics.activeOrders || 0}
              userName={customerName}
              userRole="Customer"
              userProfile={{
                userProfileId: userProfileId,
                displayName: customerName,
                roleType: 'Customer',
                status: 'Active',
                phone: customerList.find(c => c.id === customerId)?.phone || '',
                createdAt: customerList.find(c => c.id === customerId)?.createdAt,
                updatedAt: new Date().toISOString()
              }}
              entityId={customerId}
              userId={userProfileId}
              onProfileClick={() => navigate('profile')}
              additionalActions={
                <button
                  onClick={() => {
                    // Find the store ID from the cart
                    let targetStoreId = null;
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
                        const savedCart = localStorage.getItem(key);
                        if (savedCart) {
                          const parsedCart = JSON.parse(savedCart);
                          if (parsedCart.length > 0) {
                            const parts = key.split('_');
                            targetStoreId = parts[2];
                            break;
                          }
                        }
                      }
                    }
                    
                    // If we found a store with items, fetch store data and go to checkout
                    if (targetStoreId) {
                      const fetchStoreAndNavigate = async () => {
                        try {
                          const response = await fetch(`https://localhost:7062/api/Sellers/${targetStoreId}/products`);
                          if (response.ok) {
                            const storeData = await response.json();
                            
                            navigate('/checkout', {
                              state: {
                                customerId,
                                customerName,
                                customerAddresses: customerList.find(c => c.id === customerId)?.customerAddresses || [],
                                selectedStore: storeData,
                                storeName: cart[0]?.storeName,
                                storeId: targetStoreId
                              }
                            });
                          } else {
                            showSnackbar('Could not load store details', 'error');
                          }
                        } catch (err) {
                          console.error('Error fetching store:', err);
                          showSnackbar('Error loading checkout', 'error');
                        }
                      };
                      
                      fetchStoreAndNavigate();
                    } else {
                      // Empty cart - still go to checkout with no store
                      navigate('/checkout', {
                        state: {
                          customerId,
                          customerName,
                          customerAddresses: customerList.find(c => c.id === customerId)?.customerAddresses || [],
                          selectedStore: null,
                          storeName: null,
                          storeId: null
                        }
                      });
                    }
                  }}
                  className="p-2 hover:bg-grey-200 rounded-lg transition-all relative"
                >
                  <Icon.ShoppingCartSimple className="w-6 h-6 text-charcoal-400" weight="regular" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-sage-500 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </button>
              }
                          
            />
          
        </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {!customerId && (
              <div className="bg-cream-50 border border-grey-stroke rounded-xl p-6 text-center">
                <p className="text-body-medium text-charcoal-500">
                  Please select a customer profile to view your dashboard.
                </p>
              </div>
            )}

            {customerId && loading && !location.pathname.includes("/customer-dashboard/profile") && (
              <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift text-center border border-grey-stroke">
                <p className="text-body-medium text-charcoal-400">Loading your dashboard...</p>
              </div>
            )}

            {customerId && error && !loading && !location.pathname.includes("/customer-dashboard/profile") && (
              <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded shadow-soft-lift">
                <p className="text-body-medium text-error-text">{error}</p>
              </div>
            )}

           {customerId && !loading && !error && (
            <>
              {!location.pathname.includes("/customer-dashboard/profile") &&
               !location.pathname.includes("/customer-dashboard/notifications") && (
                <>
                  {/* Active Orders Carousel */}
                    {activeOrders.length > 0 && (
                    <section className="mb-8 relative">
                    {/* Left Arrow - Outside card */}
                    {activeOrders.length > 1 && (
                        <button
                        onClick={() => setActiveOrderIndex((prev) => (prev - 1 + activeOrders.length) % activeOrders.length)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center transition-all shadow-lg border-2 border-grey-stroke"
                        >
                        <Icon.CaretLeft size={24} weight="bold" className="text-sage-600" />
                        </button>
                    )}

                    {/* Right Arrow - Outside card */}
                    {activeOrders.length > 1 && (
                        <button
                        onClick={() => setActiveOrderIndex((prev) => (prev + 1) % activeOrders.length)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center transition-all shadow-lg border-2 border-grey-stroke"
                        >
                        <Icon.CaretRight size={24} weight="bold" className="text-sage-600" />
                        </button>
                    )}

                    {/* Cards Container with Scroll Animation */}
                    <div className="overflow-hidden px-16 py-2">
                        <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${activeOrderIndex * 100}%)` }}
                        >
                        {activeOrders.map((order, index) => (
                            <div 
                            key={order.id}
                            className="w-full flex-shrink-0"
                            >
                            <div 
                                onClick={() => {
                                setShowOrderDetails(true);
                                // Update the displayed order when clicking a card
                                setActiveOrderIndex(index);
                                }}
                                className="bg-gradient-to-br from-sage-500 to-sage-600 rounded-2xl p-6 shadow-2xl cursor-pointer hover:shadow-3xl transition-all transform hover:scale-[1.02] border-2 border-sage-700 mx-2"
                            >
                                <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Icon.Package size={24} weight="fill" className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Active Order</p>
                                        <h3 className="text-white text-2xl font-bold">Order #{order.id}</h3>
                                    </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-white/90">
                                    <div>
                                        <p className="text-xs text-white/70">Store</p>
                                        <p className="font-semibold text-sm truncate">{order.sellerName}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-white/70">Status</p>
                                      <p className="font-semibold text-sm">
                                        {order.status?.toLowerCase() === 'picked up' 
                                          ? 'Out for Delivery' 
                                          : order.status}
                                      </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/70">Total</p>
                                        <p className="font-semibold text-sm">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                    </div>
                                </div>
                                
                                <div className="text-white">
                                    <Icon.CaretRight size={32} weight="bold" />
                                </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-white/80 text-sm text-center">
                                    👆 Click to track your order
                                </p>
                                </div>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    {activeOrders.length > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                        {activeOrders.map((_, index) => (
                            <button
                            key={index}
                            onClick={() => setActiveOrderIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                                activeOrderIndex === index ? 'bg-sage-500 w-8' : 'bg-grey-stroke w-2 hover:bg-grey-400'
                            }`}
                            />
                        ))}
                        </div>
                    )}
                    </section>
                    )}

                    {/* Main Navigation Tabs - Orders / Services */}
                    <section className="mb-8">
                      <div className="flex gap-2 border-b-2 border-grey-stroke">
                        <button
                          onClick={() => setMainTab('orders')}
                          className={`px-8 py-4 font-bold text-lg transition-all relative ${
                            mainTab === 'orders'
                              ? 'text-sage-600'
                              : 'text-charcoal-400 hover:text-charcoal-600'
                          }`}
                        >
                          Orders
                          {mainTab === 'orders' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-sage-500 rounded-t-lg" />
                          )}
                        </button>
                        <button
                          onClick={() => setMainTab('services')}
                          className={`px-8 py-4 font-bold text-lg transition-all relative ${
                            mainTab === 'services'
                              ? 'text-sage-600'
                              : 'text-charcoal-400 hover:text-charcoal-600'
                          }`}
                        >
                          Services
                          {mainTab === 'services' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-sage-500 rounded-t-lg" />
                          )}
                        </button>
                      </div>
                    </section>

                    {/* Orders Section */}
                    {mainTab === 'orders' && (
                      <section className="mb-8">
                        <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg overflow-hidden">
                          <div className="bg-sage-100 dark:bg-sage-900/30 p-4 border-b border-grey-stroke dark:border-charcoal-400">
                            <h3 className="text-card-h3 text-charcoal-600 dark:text-white font-semibold flex items-center gap-2">
                              <Icon.Package size={24} className="text-sage-600 dark:text-sage-400" weight="fill" />
                              Orders
                            </h3>
                            <p className="text-body-small text-charcoal-400 dark:text-charcoal-300 mt-1">
                              Your product orders and purchases
                            </p>
                          </div>

                          {/* Filters */}
                          <div className="p-4 border-b border-grey-stroke dark:border-charcoal-400 bg-white dark:bg-charcoal-500">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex-1 min-w-[200px] relative">
                                <Icon.MagnifyingGlass
                                  size={18}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"
                                />
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Search orders..."
                                  className="w-full pl-10 pr-4 py-2 text-sm border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                />
                              </div>

                              <select
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                              >
                                <option value="all">All Orders ({orders.length})</option>
                                <option value="active">Active ({activeOrders.length})</option>
                                <option value="completed">Completed ({completedOrders.length})</option>
                                <option value="cancelled">Cancelled ({cancelledOrders.length})</option>
                              </select>

                              <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                              >
                                <option value="date-desc">Newest</option>
                                <option value="date-asc">Oldest</option>
                                <option value="amount-desc">Highest $</option>
                                <option value="amount-asc">Lowest $</option>
                              </select>

                              <select
                                value={fulfillmentFilter}
                                onChange={(e) => setFulfillmentFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                              >
                                <option value="all">All Types</option>
                                <option value="delivery">Delivery</option>
                                <option value="pickup">Pickup</option>
                              </select>

                              <span className="text-sm text-charcoal-500 dark:text-charcoal-300 whitespace-nowrap">
                                {displayedOrders.length} {displayedOrders.length === 1 ? 'order' : 'orders'}
                              </span>
                            </div>
                          </div>

                          {/* Orders Display */}
                          {displayedOrders.length === 0 ? (
                            <div className="p-12 text-center text-charcoal-400 dark:text-charcoal-300">
                              <Icon.Package size={48} className="mx-auto text-charcoal-300 mb-3" />
                              <p className="text-body-regular mb-4">
                                No {activeTab !== 'all' ? activeTab : ''} orders yet
                              </p>
                              <button
                                onClick={() => navigate('/mainStore', { state: { customerId, customerName } })}
                                className="bg-sage-500 hover:bg-sage-600 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                              >
                                Start Shopping
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-grey-100 dark:bg-charcoal-500 border-b border-grey-stroke dark:border-charcoal-400">
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Order #</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Store</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Status</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Total</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Date</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-grey-stroke dark:divide-charcoal-400">
                                  {displayedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-cream-100 dark:hover:bg-charcoal-500 transition-colors">
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold">
                                        #{order.id}
                                      </td>
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50">
                                        {order.sellerName || "—"}
                                      </td>
                                      <td className="p-4">
                                        <StatusChip variant={getStatusVariant(order.status)}>
                                          {order.status || "Unknown"}
                                        </StatusChip>
                                      </td>
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50">
                                        {formatCurrency(order.totalAmount || 0)}
                                      </td>
                                      <td className="p-4 text-body-small text-charcoal-600 dark:text-cream-50">
                                        {formatDate(order.createdAt)}
                                      </td>
                                      <td className="p-4 text-center">
                                        <button
                                          onClick={() => openOrderModal(order)}
                                          className="px-4 py-2 bg-sage-500 hover:bg-sage-600 dark:bg-sage-700 dark:hover:bg-sage-600 text-cream-50 rounded-md text-body-small transition-colors"
                                        >
                                          View Details
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </section>
                      )}

                      {/* Service Bookings Section */}
                      {mainTab === 'services' && (
                      <>
                      <section className="mb-8">
                        <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg overflow-hidden">
                          <div className="bg-sage-100 dark:bg-sage-900/30 p-4 border-b border-grey-stroke dark:border-charcoal-400">
                            <h3 className="text-card-h3 text-charcoal-600 dark:text-white font-semibold flex items-center gap-2">
                              <ScissorsIcon size={24} className="text-sage-600 dark:text-sage-400" weight="fill" />
                              Service Bookings
                            </h3>
                            <p className="text-body-small text-charcoal-400 dark:text-charcoal-300 mt-1">
                              Your service appointments and bookings
                            </p>
                          </div>

                          {/* Filters */}
                          <div className="p-4 border-b border-grey-stroke dark:border-charcoal-400 bg-white dark:bg-charcoal-500">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex-1 min-w-[200px] relative">
                                <Icon.MagnifyingGlass
                                  size={18}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"
                                />
                                <input
                                  type="text"
                                  value={serviceSearchQuery}
                                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                                  placeholder="Search bookings..."
                                  className="w-full pl-10 pr-4 py-2 text-sm border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                />
                              </div>

                              <select
                                value={serviceStatusFilter}
                                onChange={(e) => setServiceStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                              >
                                <option value="all">All Bookings ({serviceBookings.length})</option>
                                <option value="completed">Completed ({serviceBookings.filter(b => b.status?.toLowerCase() === 'completed').length})</option>
                                <option value="confirmed">Confirmed ({serviceBookings.filter(b => b.status?.toLowerCase() === 'confirmed').length})</option>
                                <option value="rejected">Rejected ({serviceBookings.filter(b => b.status?.toLowerCase() === 'rejected').length})</option>
                                <option value="cancelled">Cancelled ({serviceBookings.filter(b => b.status?.toLowerCase() === 'canceled' || b.status?.toLowerCase() === 'cancelled').length})</option>
                              </select>

                              <select
                                value={serviceSortBy}
                                onChange={(e) => setServiceSortBy(e.target.value)}
                                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                              >
                                <option value="date-desc">Newest</option>
                                <option value="date-asc">Oldest</option>
                                <option value="amount-desc">Highest $</option>
                                <option value="amount-asc">Lowest $</option>
                              </select>

                              <span className="text-sm text-charcoal-500 dark:text-charcoal-300 whitespace-nowrap">
                                {displayedServiceBookings.length} {displayedServiceBookings.length === 1 ? 'booking' : 'bookings'}
                              </span>
                            </div>
                          </div>

                          {historyMetrics && historyMetrics.inProgressBookings && historyMetrics.inProgressBookings.length > 0 && (
                            <div className="p-4 space-y-4">
                              {historyMetrics.inProgressBookings.map((booking) => {
                                const getCheckpointStatus = (checkpointName) => {
                                  const statusOrder = ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'];
                                  const currentIndex = statusOrder.indexOf(booking.status);
                                  const checkpointIndex = statusOrder.indexOf(checkpointName);
                                  if (currentIndex >= checkpointIndex) return 'completed';
                                  return 'pending';
                                };

                                return (
                                  <div
                                    key={booking.id}
                                    className="bg-grey-100 dark:bg-charcoal-500 border border-grey-stroke dark:border-charcoal-400 rounded-lg p-6 hover:shadow-md transition-shadow"
                                  >
                                    {/* Service Header */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div className="flex-1">
                                        <h4 className="text-body-medium text-charcoal-600 dark:text-white font-semibold mb-1">
                                          {booking.serviceName || 'Service'}
                                        </h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-small text-charcoal-400 dark:text-charcoal-300">
                                          <span><span className="font-medium">Provider:</span> {booking.businessName || booking.providerName || 'N/A'}</span>
                                          <span><span className="font-medium">Date:</span> {formatDate(booking.serviceDate)}</span>
                                          <span><span className="font-medium">Booking ID:</span> #{booking.id}</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleViewBooking(booking)}
                                        className="px-4 py-2 bg-sage-500 hover:bg-sage-600 dark:bg-sage-700 dark:hover:bg-sage-600 text-cream-50 rounded-md text-body-small transition-colors flex-shrink-0"
                                      >
                                        View Details
                                      </button>
                                    </div>

                                    {/* Checkpoint Timeline */}
                                    <div className="relative">
                                      <div className="flex items-center justify-between">
                                        {/* Checkpoint 1: Pending */}
                                        <div className="flex flex-col items-center flex-1">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                            getCheckpointStatus('Pending') === 'completed'
                                              ? 'bg-sage-500 border-sage-500'
                                              : 'bg-grey-200 dark:bg-charcoal-600 border-grey-stroke dark:border-charcoal-400'
                                          }`}>
                                            {getCheckpointStatus('Pending') === 'completed' ? (
                                              <CheckCircle size={20} className="text-white" weight="fill" />
                                            ) : (
                                              <Circle size={20} className="text-charcoal-400 dark:text-charcoal-300" weight="regular" />
                                            )}
                                          </div>
                                          <div className="mt-2 text-center">
                                            <p className={`text-label-small font-medium ${
                                              getCheckpointStatus('Pending') === 'completed'
                                                ? 'text-sage-600 dark:text-sage-400'
                                                : 'text-charcoal-400 dark:text-charcoal-300'
                                            }`}>
                                              Pending
                                            </p>
                                            <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                                              Awaiting Confirmation
                                            </p>
                                          </div>
                                        </div>

                                        {/* Connection Line 1 */}
                                        <div className={`flex-1 h-0.5 mx-2 -mt-12 ${
                                          getCheckpointStatus('Confirmed') === 'completed'
                                            ? 'bg-sage-500'
                                            : 'bg-grey-stroke dark:bg-charcoal-400'
                                        }`} />

                                        {/* Checkpoint 2: Confirmed */}
                                        <div className="flex flex-col items-center flex-1">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                            getCheckpointStatus('Confirmed') === 'completed'
                                              ? 'bg-sage-500 border-sage-500'
                                              : 'bg-grey-200 dark:bg-charcoal-600 border-grey-stroke dark:border-charcoal-400'
                                          }`}>
                                            {getCheckpointStatus('Confirmed') === 'completed' ? (
                                              <CheckCircle size={20} className="text-white" weight="fill" />
                                            ) : (
                                              <Circle size={20} className="text-charcoal-400 dark:text-charcoal-300" weight="regular" />
                                            )}
                                          </div>
                                          <div className="mt-2 text-center">
                                            <p className={`text-label-small font-medium ${
                                              getCheckpointStatus('Confirmed') === 'completed'
                                                ? 'text-sage-600 dark:text-sage-400'
                                                : 'text-charcoal-400 dark:text-charcoal-300'
                                            }`}>
                                              Confirmed
                                            </p>
                                            <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                                              Booking Approved
                                            </p>
                                          </div>
                                        </div>

                                        {/* Connection Line 2 */}
                                        <div className={`flex-1 h-0.5 mx-2 -mt-12 ${
                                          getCheckpointStatus('InProgress') === 'completed'
                                            ? 'bg-sage-500'
                                            : 'bg-grey-stroke dark:bg-charcoal-400'
                                        }`} />

                                        {/* Checkpoint 3: In Progress */}
                                        <div className="flex flex-col items-center flex-1">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                            getCheckpointStatus('InProgress') === 'completed'
                                              ? 'bg-sage-500 border-sage-500'
                                              : 'bg-grey-200 dark:bg-charcoal-600 border-grey-stroke dark:border-charcoal-400'
                                          }`}>
                                            {getCheckpointStatus('InProgress') === 'completed' ? (
                                              <CheckCircle size={20} className="text-white" weight="fill" />
                                            ) : (
                                              <Circle size={20} className="text-charcoal-400 dark:text-charcoal-300" weight="regular" />
                                            )}
                                          </div>
                                          <div className="mt-2 text-center">
                                            <p className={`text-label-small font-medium ${
                                              getCheckpointStatus('InProgress') === 'completed'
                                                ? 'text-sage-600 dark:text-sage-400'
                                                : 'text-charcoal-400 dark:text-charcoal-300'
                                            }`}>
                                              In Progress
                                            </p>
                                            <p className="text-label-small text-charcoal-400 dark:text-charcoal-300">
                                              Service Started
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Current Status Badge */}
                                      <div className="mt-4 flex items-center justify-center">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-cream-50 dark:bg-charcoal-600 rounded-full border border-grey-stroke dark:border-charcoal-400">
                                          <span className="text-label-small text-charcoal-400 dark:text-charcoal-300">Current Status:</span>
                                          <StatusChip variant={getBookingStatusVariant(booking.status)}>
                                            {booking.status}
                                          </StatusChip>
                                        </div>
                                      </div>

                                      {/* Timer and Cancel for Pending Bookings */}
                                      {booking.status === 'Pending' && booking.createdAt && (
                                        <div className="mt-4 flex flex-col items-center gap-3">
                                          <BookingTimer
                                            createdAt={booking.createdAt}
                                            durationMinutes={1}
                                            onExpire={() => handleTimerExpire(booking.id)}
                                          />
                                          <button
                                            onClick={() => handleCancelBookingClick(booking)}
                                            disabled={cancellingBookingId === booking.id}
                                            className="px-6 py-2 bg-error-bg hover:bg-error-hover text-error-text border-2 border-error-border rounded-lg text-body-small font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {displayedServiceBookings && displayedServiceBookings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-grey-100 dark:bg-charcoal-500 border-b border-grey-stroke dark:border-charcoal-400">
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Booking ID</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Service Date & Time</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Provider</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Service</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Type</th>
                                    <th className="text-right p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Price</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Status</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Timer</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-grey-stroke dark:divide-charcoal-400">
                                  {displayedServiceBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-cream-100 dark:hover:bg-charcoal-500 transition-colors">
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold">
                                        #{booking.id}
                                      </td>
                                      <td className="p-4 text-body-small text-charcoal-600 dark:text-cream-50">
                                        <div>{formatDate(booking.serviceDate)}</div>
                                        <div className="text-charcoal-400 dark:text-charcoal-300">{booking.serviceTime || 'Time TBD'}</div>
                                      </td>
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50">
                                        {booking.businessName || booking.providerName || 'N/A'}
                                      </td>
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50">
                                        {booking.serviceName || 'N/A'}
                                      </td>
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50">
                                        {booking.serviceType || 'N/A'}
                                      </td>
                                      <td className="p-4 text-body-small text-charcoal-600 dark:text-cream-50 text-right">
                                        {booking.finalPrice != null ? (
                                          <div>
                                            <div className="font-semibold">{formatCurrency(booking.finalPrice)}</div>
                                            <div className="text-charcoal-400 dark:text-charcoal-300">Paid</div>
                                          </div>
                                        ) : booking.quotedPrice != null ? (
                                          <div>
                                            <div className="font-semibold">{formatCurrency(booking.quotedPrice)}</div>
                                            <div className="text-charcoal-400 dark:text-charcoal-300">Quoted</div>
                                          </div>
                                        ) : (
                                          'Pending'
                                        )}
                                      </td>
                                      <td className="p-4 text-center">
                                        <StatusChip variant={getBookingStatusVariant(booking.status)}>
                                          {booking.status}
                                        </StatusChip>
                                      </td>
                                      <td className="p-4 text-center">
                                        {booking.status === 'Pending' && booking.createdAt && (
                                          <BookingTimer
                                            createdAt={booking.createdAt}
                                            durationMinutes={1}
                                            onExpire={() => handleTimerExpire(booking.id)}
                                            compact={true}
                                          />
                                        )}
                                        {booking.status !== 'Pending' && (
                                          <span className="text-charcoal-400 dark:text-charcoal-300 text-label-small">—</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <button
                                            onClick={() => handleViewBooking(booking)}
                                            className="px-4 py-2 bg-sage-500 hover:bg-sage-600 dark:bg-sage-700 dark:hover:bg-sage-600 text-cream-50 rounded-md text-body-small transition-colors"
                                          >
                                            View
                                          </button>
                                          {booking.status === 'Pending' && (
                                            <button
                                              onClick={() => handleCancelBookingClick(booking)}
                                              disabled={cancellingBookingId === booking.id}
                                              className="px-4 py-2 bg-error-bg hover:bg-error-hover text-error-text border border-error-border rounded-md text-body-small transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-12 text-center text-charcoal-400 dark:text-charcoal-300">
                              <ScissorsIcon size={48} className="mx-auto text-charcoal-300 mb-3" />
                              <p className="text-body-regular mb-4">
                                {serviceSearchQuery || serviceStatusFilter !== 'all'
                                  ? 'No bookings match your filters'
                                  : 'No service bookings yet'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Service Reviews Section */}
                      <section className="mb-8">
                        <div className="bg-cream-50 dark:bg-charcoal-600 border border-grey-stroke dark:border-charcoal-400 rounded-lg overflow-hidden">
                          <div className="bg-sage-100 dark:bg-sage-900/30 p-4 border-b border-grey-stroke dark:border-charcoal-400">
                            <h3 className="text-card-h3 text-charcoal-600 dark:text-white font-semibold flex items-center gap-2">
                              <ChatCircleTextIcon size={24} className="text-sage-600 dark:text-sage-400" weight="fill" />
                              My Service Reviews
                            </h3>
                            <p className="text-body-small text-charcoal-400 dark:text-charcoal-300 mt-1">
                              Reviews you've submitted for service providers
                            </p>
                          </div>
                          {serviceReviews && serviceReviews.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-grey-100 dark:bg-charcoal-500 border-b border-grey-stroke dark:border-charcoal-400">
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Review ID</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Date</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Service Provider</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Service</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Overall Rating</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Quality</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Professionalism</th>
                                    <th className="text-center p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Timeliness</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Comment</th>
                                    <th className="text-left p-4 text-label-medium text-charcoal-600 dark:text-cream-50">Provider Response</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-grey-stroke dark:divide-charcoal-400">
                                  {serviceReviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-cream-100 dark:hover:bg-charcoal-500 transition-colors">
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50 font-semibold">
                                        #{review.id}
                                      </td>
                                      <td className="p-4 text-body-small text-charcoal-600 dark:text-cream-50">
                                        {formatDate(review.createdAt)}
                                      </td>
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50">
                                        {review.providerName || review.businessName || 'N/A'}
                                      </td>
                                      <td className="p-4 text-body-regular text-charcoal-600 dark:text-cream-50">
                                        {review.serviceName || 'N/A'}
                                      </td>
                                      <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <span className="text-sage-600 dark:text-sage-400 font-semibold">{review.overallRating}</span>
                                          <span className="text-charcoal-400 dark:text-charcoal-300">/5</span>
                                        </div>
                                      </td>
                                      <td className="p-4 text-center text-body-small text-charcoal-600 dark:text-cream-50">
                                        {review.qualityRating ? `${review.qualityRating}/5` : '—'}
                                      </td>
                                      <td className="p-4 text-center text-body-small text-charcoal-600 dark:text-cream-50">
                                        {review.professionalismRating ? `${review.professionalismRating}/5` : '—'}
                                      </td>
                                      <td className="p-4 text-center text-body-small text-charcoal-600 dark:text-cream-50">
                                        {review.timelinessRating ? `${review.timelinessRating}/5` : '—'}
                                      </td>
                                      <td className="p-4 text-body-small text-charcoal-600 dark:text-cream-50 max-w-xs">
                                        <div className="truncate" title={review.comment}>
                                          {review.comment || 'No comment'}
                                        </div>
                                      </td>
                                      <td className="p-4 text-body-small text-charcoal-600 dark:text-cream-50 max-w-xs">
                                        <div className="truncate" title={review.providerResponse}>
                                          {review.providerResponse || 'No response yet'}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-12 text-center text-charcoal-400 dark:text-charcoal-300">
                              No reviews found. Complete a service booking to leave a review!
                            </div>
                          )}
                        </div>
                      </section>
                      </>
                      )}
               </>
              )}

            </>
            )}
            {location.pathname.includes("/customer-dashboard/profile") && (
              <ProfilePage
                userProfile={{
                  userProfileId: customerId,
                  displayName: customerName,
                  phone: customerList.find(c => c.id === customerId)?.phone || '',
                  street: customerList.find(c => c.id === customerId)?.street || '',
                  city: customerList.find(c => c.id === customerId)?.city || '',
                  region: customerList.find(c => c.id === customerId)?.region || '',
                  postalCode: customerList.find(c => c.id === customerId)?.postalCode || '',
                  country: customerList.find(c => c.id === customerId)?.country || 'Bahrain',
                  address: customerList.find(c => c.id === customerId)?.customerAddresses?.[0]?.fullAddress || '',
                  status: 'Active',
                  createdAt: customerList.find(c => c.id === customerId)?.createdAt,
                  updatedAt: new Date().toISOString()
                }}
                userRole="Customer"
                entityId={customerId}
                customerAddresses={customerList.find(c => c.id === customerId)?.customerAddresses || []} // ADD THIS LINE
                onProfileUpdate={async (updates) => {
                  try {
                    console.log('Profile updates:', updates);
                    // Reload customer data after update
                    const customers = await getCustomers();
                    setCustomerList(customers); // UPDATE THE ENTIRE LIST
                    const updatedCustomer = customers.find(c => c.id === customerId);
                    if (updatedCustomer) {
                      setCustomerName(updatedCustomer.fullName || customerName);
                    }
                  } catch (error) {
                    console.error('Error updating profile:', error);
                    throw error;
                  }
                
              }}
              readOnly={false}
            />
          )}

          {/* Notifications Section */}
          {location.pathname.includes("/customer-dashboard/notifications") && (
            <NotificationsPage
              userId={userProfileId}
              searchQuery={notificationSearchQuery}
            />
          )}
          </div>
        </main>
      </div>
      {/* OrderDetails Modal */}
        {showOrderDetails && currentActiveOrder && (
        <OrderDetails 
            order={currentActiveOrder} 
            onClose={() => {
            setShowOrderDetails(false);
            }} 
        />
        )}

          {/* Clear Cart Modal */}
          {showClearCartModal && pendingReorderItems && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-grey-stroke">
                <h3 className="text-xl font-bold text-charcoal-600 mb-4">Re-Order</h3>
                <p className="text-body-regular text-charcoal-500 mb-6">
                  {cart.length > 0 
                    ? "You have items in your cart. Would you like to clear your current cart and reorder these items instead?"
                    : `Would you like to add ${pendingReorderItems?.items.length} item${pendingReorderItems?.items.length !== 1 ? 's' : ''} from this order to your cart?`
                  }
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={confirmClearAndReorder}
                    className="flex-1 bg-sage-500 hover:bg-sage-600 text-white py-2.5 rounded-lg font-semibold"
                  >
                    {cart.length > 0 ? 'Clear Cart & Reorder' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={cancelReorder}
                    className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
            {reviewModal.show && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop-enter">
                <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-grey-stroke modal-content-enter">
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Icon.Star size={24} weight="fill" className="text-yellow-600" />
                    </div>
                    <h3 className="ml-3 text-xl font-bold text-charcoal-700">Write a Review</h3>
                  </div>
                  
                  <p className="text-charcoal-600 mb-4">
                    Product: <strong className="text-charcoal-700">{reviewModal.productName}</strong>
                  </p>

                  {reviewModal.error && (
                    <div className="mb-4 p-3 rounded-lg bg-error-bg border-l-4 border-error-btn">
                      <p className="text-sm text-error-text">{reviewModal.error}</p>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewModal(prev => ({ ...prev, rating: star }))}
                            className={`text-3xl transition-colors ${
                              star <= reviewModal.rating ? 'text-yellow-400' : 'text-grey-stroke'
                            } hover:text-yellow-400`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-2">Comment</label>
                      <textarea
                        value={reviewModal.comment}
                        onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                        rows="4"
                        className="w-full border-2 border-grey-stroke rounded-lg p-3 text-charcoal-700 bg-white focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                        placeholder="Share your experience with this product..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitProductReview}
                      disabled={reviewModal.loading}
                      className="flex-1 bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {reviewModal.loading ? "Submitting..." : "Submit Review"}
                    </button>
                    <button
                      onClick={closeReviewModal}
                      disabled={reviewModal.loading}
                      className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-3 px-4 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* History Page Modals */}
          <ViewOrderModal
            isOpen={viewOrderModal.isOpen}
            onClose={() => setViewOrderModal({ isOpen: false, order: null })}
            order={viewOrderModal.order}
          />

          <ViewServiceBookingModal
            isOpen={viewBookingModal.isOpen}
            onClose={() => setViewBookingModal({ isOpen: false, booking: null })}
            booking={viewBookingModal.booking}
            onOpenReview={handleOpenReview}
            hasReview={viewBookingModal.booking ? bookingHasReview(viewBookingModal.booking.id) : false}
            onCancelBooking={handleCancelBookingClick}
            onTimerExpire={handleTimerExpire}
          />

          <ServiceReviewModal
            isOpen={serviceReviewModal.isOpen}
            onClose={() => setServiceReviewModal({ isOpen: false, booking: null })}
            booking={serviceReviewModal.booking}
            onSubmit={handleSubmitServiceReview}
          />

          {/* Cancel Booking Confirmation Dialog */}
          {showCancelDialog && cancelBookingData && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-cream-50 dark:bg-charcoal-600 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-grey-stroke dark:border-charcoal-400">
                  <h3 className="text-card-h2 text-charcoal-600 dark:text-white font-bold">
                    Cancel Booking?
                  </h3>
                  <p className="text-body-small text-charcoal-400 dark:text-charcoal-300 mt-2">
                    Booking ID: #{cancelBookingData.id} - {cancelBookingData.serviceName}
                  </p>
                </div>

                <div className="p-6">
                  <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">
                    Reason for cancellation *
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="E.g., Changed my mind, Found another provider, etc."
                    className="w-full h-24 border-2 border-grey-stroke dark:border-charcoal-400 dark:bg-charcoal-500 dark:text-white rounded-xl p-3 text-body-small resize-none focus:border-sage-500 focus:outline-none"
                    maxLength={200}
                    autoFocus
                  />
                  <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-2">
                    {cancellationReason.length}/200 characters
                  </p>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => {
                      setShowCancelDialog(false);
                      setCancellationReason('');
                      setCancelBookingData(null);
                    }}
                    className="flex-1 px-4 py-2 bg-grey-200 dark:bg-charcoal-400 text-charcoal-600 dark:text-white font-bold rounded-xl hover:bg-grey-300 dark:hover:bg-charcoal-300 transition-all"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleConfirmCancelBooking}
                    disabled={!cancellationReason.trim() || cancellingBookingId}
                    className="flex-1 px-4 py-2 bg-error-bg text-error-text border-2 border-error-border font-bold rounded-xl hover:bg-error-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancellingBookingId ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => setSnackbar({ open: false, message: '', type: 'success' })}
          />


    </div>
  );

};
export default CustomerDashboard;