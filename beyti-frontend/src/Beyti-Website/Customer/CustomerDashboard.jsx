import React, { useState, useEffect, useMemo } from "react";
import * as Icon from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import NavigationButton from "../../components/NavigationButton";
import AnalyticsCard from "../../components/AnalyticsCard";
import StatusChip from "../../components/StatusChip";
import CRUDButton from "../../components/CRUDButton";
import { Table, TableHeader, TableBody, TableRow } from "../../components/Table";
import '../Seller/Components/modalAnimations.css';
import OrderDetails from '../Store/Components/OrderDetails';
import Snackbar from '../../components/Snackbar';

import {
  createReview,
  deleteReview,
} from "../../services/api";

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

// Helper functions
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
                              {new Date(item.review.createdAt).toLocaleDateString()}
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

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 5000);
  };

  const [showReorderModal, setShowReorderModal] = useState(false);
  const [pendingReorderItems, setPendingReorderItems] = useState(null);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const [activeTab, setActiveTab] = useState('all');

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

  // Load orders
 // Load orders with reviews
useEffect(() => {
  if (!customerId) return;
  const loadOrders = async () => {
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
};
  loadOrders();
}, [customerId]);



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
    default: ordersToDisplay = orders; // 'all'
  }
  
  // Sort by most recent first
  return [...ordersToDisplay].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}, [activeTab, orders, activeOrders, completedOrders, cancelledOrders]);

// Set the currently displayed active order based on index
const currentActiveOrder = activeOrders.length > 0 ? activeOrders[activeOrderIndex] : null;

  const getPageTitle = () => {
  if (location.pathname === "/customer-dashboard" || location.pathname.includes("/customer-dashboard/orders")) {
    return "My Orders";
    } else if (location.pathname.includes("/customer-dashboard/addresses")) {
      return "My Addresses";
    } else if (location.pathname.includes("/customer-dashboard/favorites")) {
      return "My Favorites";
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

const handleSubmitReview = async () => {
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
                  createdAt: new Date().toISOString()
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
              setCustomerName(selected?.fullName || "My Account");
              setCustomerId(id);
              setSelectModalOpen(false);
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
            selected={location.pathname === "/customer-dashboard" || location.pathname.includes("/customer-dashboard")}
            onClick={() => navigate("/customer-dashboard")}
            icon={<Icon.Package size={20} weight={location.pathname === "/customer-dashboard" ? "fill" : "regular"} />}
          >
            My Orders
          </NavigationButton>

          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/orders")}
            onClick={() => navigate("orders")}
            icon={<Icon.Package size={20} weight={location.pathname.includes("/orders") ? "fill" : "regular"} />}
          >
            Order History
          </NavigationButton>

          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/addresses")}
            onClick={() => navigate("addresses")}
            icon={<Icon.MapPin size={20} weight={location.pathname.includes("/addresses") ? "fill" : "regular"} />}
          >
            Addresses
          </NavigationButton>

          <NavigationButton
            selected={location.pathname.includes("/customer-dashboard/favorites")}
            onClick={() => navigate("favorites")}
            icon={<Icon.Heart size={20} weight={location.pathname.includes("/favorites") ? "fill" : "regular"} />}
          >
            Favorites
          </NavigationButton>
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col">
        <div className="border-b border-grey-stroke bg-grey-200">
        
      
          <div className="border-b border-grey-stroke bg-grey-200">
            <PageHeader
              title="My Orders"
              notificationCount={metrics.activeOrders || 0}
              userName={customerName}
              userRole="Customer"
              userProfile={{
                userProfileId: customerId,
                displayName: customerName,
                roleType: 'Customer',
                status: 'Active',
                phone: customerList.find(c => c.id === customerId)?.phone || '',
                createdAt: customerList.find(c => c.id === customerId)?.createdAt,
                updatedAt: new Date().toISOString()
              }}
              entityId={customerId}
              userId={customerId}
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

            {customerId && loading && (
              <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift text-center border border-grey-stroke">
                <p className="text-body-medium text-charcoal-400">Loading your dashboard...</p>
              </div>
            )}

            {customerId && error && !loading && (
              <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded shadow-soft-lift">
                <p className="text-body-medium text-error-text">{error}</p>
              </div>
            )}

            {customerId && !loading && !error && (
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

                    {/* Order Tabs */}
                      <section className="mb-8">
                        <div className="flex gap-2 mb-6 border-b border-grey-stroke">
                          {[
                            { id: 'all', label: 'All Orders', count: orders.length },
                            { id: 'active', label: 'Active', count: activeOrders.length },
                            { id: 'completed', label: 'Completed', count: completedOrders.length },
                            { id: 'cancelled', label: 'Cancelled', count: cancelledOrders.length }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`px-6 py-3 font-semibold transition-all relative ${
                                activeTab === tab.id
                                  ? 'text-sage-600'
                                  : 'text-charcoal-400 hover:text-charcoal-600'
                              }`}
                            >
                              {tab.label}
                              {tab.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                  activeTab === tab.id
                                    ? 'bg-sage-500 text-white'
                                    : 'bg-grey-200 text-charcoal-600'
                                }`}>
                                  {tab.count}
                                </span>
                              )}
                              {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage-500" />
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Orders Display */}
                      <div className="mt-6"> 
                        {displayedOrders.length === 0 ? (
                         <div className="text-center py-12 bg-white rounded-xl border border-grey-stroke shadow-sm">
                            <Icon.Package size={48} className="mx-auto text-charcoal-300 mb-3" />
                            <p className="text-body-regular text-charcoal-400 mb-4">
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
                          <div className="bg-white rounded-xl border border-grey-stroke shadow-sm overflow-hidden">
                           <Table>
                            <TableHeader columns={["Order #", "Store", "Status", "Total", "Date", "Action"]} />
                            <TableBody>
                              {displayedOrders.map((order) => (
                                <TableRow
                                  key={order.id}
                                  data={[
                                    `#${order.id}`,
                                    order.sellerName || "—",
                                    <StatusChip variant={getStatusVariant(order.status)}>
                                      {order.status || "Unknown"}
                                    </StatusChip>,
                                    formatCurrency(order.totalAmount || 0),
                                    formatDate(order.createdAt),
                                  ]}
                                  actions={
                                    <CRUDButton variant="neutral" onClick={() => openOrderModal(order)}>
                                      View Details
                                    </CRUDButton>
                                  }
                                />
                              ))}
                            </TableBody>
                          </Table>
                          </div>
                        )}
                      </div>
                      </section>
                   
            </>
            
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
                <h3 className="text-xl font-bold text-charcoal-600 mb-4">Different Store Detected</h3>
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
                      onClick={handleSubmitReview} 
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